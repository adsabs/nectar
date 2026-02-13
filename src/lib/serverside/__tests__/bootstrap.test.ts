import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { bootstrap } from '../bootstrap';
import { getIronSession } from 'iron-session/edge';

vi.mock('iron-session/edge', async (orig) => {
  const actual = await orig<typeof import('iron-session/edge')>();
  return { ...actual, getIronSession: vi.fn() };
});

vi.mock('@/config', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/config')>();
  return {
    ...original,
    sessionConfig: {
      password: 'test-password-that-is-long-enough-32chars!',
      cookieName: 'test',
    },
  };
});

const getIronSessionMock = getIronSession as unknown as ReturnType<typeof vi.fn>;

describe('bootstrap', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.API_HOST_SERVER = 'https://api.example.com';
    fetchSpy = vi.spyOn(globalThis, 'fetch');

    getIronSessionMock.mockResolvedValue({
      token: null,
      save: vi.fn(),
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('forwards tracing headers to the bootstrap API', async () => {
    const req = {
      headers: {
        cookie: 'ads_session=abc',
        'x-amzn-trace-id': 'Root=1-abc',
        'x-forwarded-for': '10.0.0.1',
      },
    } as unknown as import('node:http').IncomingMessage;
    const res = {
      setHeader: vi.fn(),
    } as unknown as import('node:http').ServerResponse;

    await bootstrap(req, res);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0];
    const headers: Headers = init.headers;
    expect(headers.get('X-Amzn-Trace-Id')).toBe('Root=1-abc');
    expect(headers.get('X-Forwarded-For')).toBe('10.0.0.1');
  });

  it('makes fetch call without tracing headers when none present', async () => {
    const req = {
      headers: {
        cookie: 'ads_session=abc',
      },
    } as unknown as import('node:http').IncomingMessage;
    const res = {
      setHeader: vi.fn(),
    } as unknown as import('node:http').ServerResponse;

    await bootstrap(req, res);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0];
    const headers: Headers = init.headers;
    expect(headers.get('Cookie')).toBe('ads_session=abc');
    expect(headers.get('X-Amzn-Trace-Id')).toBeNull();
    expect(headers.get('X-Forwarded-For')).toBeNull();
  });
});
