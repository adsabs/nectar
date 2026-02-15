import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import axios from 'axios';
import { getIronSession } from 'iron-session/edge';
import { rateLimit } from '@/rateLimit';
import { getRedisClient, isRedisAvailable } from '@/lib/redis';

vi.mock('@/lib/redis', () => ({
  __esModule: true,
  getRedisClient: vi.fn(() => null),
  isRedisAvailable: vi.fn(() => false),
}));

vi.mock('iron-session/edge', () => ({
  __esModule: true,
  getIronSession: vi.fn(),
}));

vi.mock('@/rateLimit', () => ({
  __esModule: true,
  rateLimit: vi.fn(() => true),
}));

vi.mock('axios', () => {
  const get = vi.fn(() =>
    Promise.resolve({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { response: { numFound: 1, docs: [] } },
    }),
  );
  return {
    __esModule: true,
    default: { get },
  };
});

vi.mock('@/logger', () => ({
  __esModule: true,
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

type ProxyTestOptions = {
  method?: string;
  path?: string[];
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
};

const defaultSession = {
  token: {
    access_token: 'test-token',
    anonymous: false,
    expires_at: '2099-01-01',
    username: 'test-user',
  },
  isAuthenticated: true,
};

const mockedGetIronSession = vi.mocked(getIronSession);
const mockedRateLimit = vi.mocked(rateLimit);
const mockedGetRedisClient = vi.mocked(getRedisClient);
const mockedIsRedisAvailable = vi.mocked(isRedisAvailable);
const mockedAxiosGet = vi.mocked(axios.get);
type HandlerModule = typeof import('./[...path]');
let handler: HandlerModule['default'];

const executeHandler = async (options: ProxyTestOptions = {}) => {
  const { method = 'GET', path = ['search', 'query'], query = {}, headers = {} } = options;

  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method,
    headers: {
      host: 'example.com',
      origin: 'https://example.com',
      ...headers,
    },
    query: {
      ...query,
      path,
    },
  });

  if (!req.socket) {
    (req as unknown as { socket: { remoteAddress: string } }).socket = {
      remoteAddress: '127.0.0.1',
    };
  } else {
    (req.socket as unknown as { remoteAddress: string }).remoteAddress = '127.0.0.1';
  }

  await handler!(req, res);
  return { req, res };
};

beforeAll(async () => {
  process.env.API_HOST_SERVER = 'https://upstream.example.com';
  handler = (await import('./[...path]')).default;
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetIronSession.mockResolvedValue({ ...defaultSession });
  mockedRateLimit.mockReturnValue(true);
  mockedGetRedisClient.mockReturnValue(null);
  mockedIsRedisAvailable.mockReturnValue(false);
  mockedAxiosGet.mockResolvedValue({
    status: 200,
    headers: { 'content-type': 'application/json' },
    data: { response: { numFound: 1, docs: [] } },
  });
});

describe('proxy API handler', () => {
  it('rejects non-GET methods with 405', async () => {
    const { res } = await executeHandler({ method: 'POST' });
    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({ error: 'Method not allowed' });
  });

  it('rejects disallowed proxy paths with 404', async () => {
    const { res } = await executeHandler({ path: ['not', 'allowed'] });
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'Not found' });
  });

  it('rejects requests without a session token with 401', async () => {
    mockedGetIronSession.mockResolvedValueOnce({ token: null });
    const { res } = await executeHandler();
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ error: 'Unauthorized' });
  });

  it('forwards allowed GET requests and returns upstream response with cache miss headers', async () => {
    const { res } = await executeHandler({ query: { q: 'mars' } });

    expect(mockedAxiosGet).toHaveBeenCalledWith(
      '/search/query',
      expect.objectContaining({
        params: expect.objectContaining({ q: 'mars' }),
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({
      response: { numFound: 1, docs: [] },
    });
    expect(res.getHeader('X-Cache')).toBe('MISS');
    expect(res.getHeader('Content-Type')).toBe('application/json');
  });

  it('rejects rate-limited requests with 429', async () => {
    mockedRateLimit.mockReturnValueOnce(false);
    const { res } = await executeHandler();
    expect(res._getStatusCode()).toBe(429);
    expect(res._getJSONData()).toEqual({ error: 'Too many requests' });
  });

  it('returns cached response when Redis has the entry', async () => {
    const cachedBody = JSON.stringify({ response: { numFound: 5 } });
    const mockRedis = {
      hgetall: vi.fn().mockResolvedValue({
        body: cachedBody,
        contentType: 'application/json',
        statusCode: '201',
      }),
    };
    mockedGetRedisClient.mockReturnValueOnce(mockRedis as unknown as ReturnType<typeof getRedisClient>);
    mockedIsRedisAvailable.mockReturnValueOnce(true);

    const { res } = await executeHandler();

    expect(res._getStatusCode()).toBe(201);
    expect(res.getHeader('X-Cache')).toBe('HIT');
    expect(res._getData()).toBe(cachedBody);
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it('rejects path traversal attempts with 404', async () => {
    const { res } = await executeHandler({
      path: ['resolver', '..', 'secret'],
    });

    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({ error: 'Not found' });
  });
});
