import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockedRequest, rest } from 'msw';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { server } from '@/mocks/server';
import { getIronSession } from 'iron-session/edge';

// Mock dependencies used inside middleware.ts
vi.mock('iron-session/edge', async (orig) => {
  const actual = await orig<typeof import('iron-session/edge')>();
  return { ...actual, getIronSession: vi.fn() };
});

vi.mock('@/middlewares/initSession', () => ({
  initSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/middlewares/verifyMiddleware', () => ({
  verifyMiddleware: vi.fn().mockResolvedValue(new NextResponse('verify')),
}));

vi.mock('@/middlewares/legacySearchURLMiddleware', () => {
  const redirect = NextResponse.redirect('https://example.com/search?q=foo');
  return {
    isLegacySearchURL: vi.fn().mockReturnValue(false),
    legacySearchURLMiddleware: vi.fn(() => redirect),
  };
});

vi.mock('@/rateLimit', () => ({
  rateLimit: vi.fn().mockReturnValue(true),
}));

describe('middleware route integration', () => {
  const baseEnv = { ...process.env };
  const getIronSessionMock = getIronSession as unknown as ReturnType<typeof vi.fn>;
  let initSessionMock: ReturnType<typeof vi.mocked<typeof import('@/middlewares/initSession')['initSession']>>;
  let verifyMiddlewareMock: ReturnType<
    typeof vi.mocked<typeof import('@/middlewares/verifyMiddleware')['verifyMiddleware']>
  >;
  let legacySearchMiddlewareMock: ReturnType<
    typeof vi.mocked<typeof import('@/middlewares/legacySearchURLMiddleware')['legacySearchURLMiddleware']>
  >;
  let isLegacySearchURLMock: ReturnType<
    typeof vi.mocked<typeof import('@/middlewares/legacySearchURLMiddleware')['isLegacySearchURL']>
  >;
  let rateLimitMock: ReturnType<typeof vi.mocked<typeof import('@/rateLimit')['rateLimit']>>;

  beforeAll(async () => {
    initSessionMock = vi.mocked((await import('@/middlewares/initSession')).initSession);
    verifyMiddlewareMock = vi.mocked((await import('@/middlewares/verifyMiddleware')).verifyMiddleware);
    const legacySearchModule = await import('@/middlewares/legacySearchURLMiddleware');
    legacySearchMiddlewareMock = vi.mocked(legacySearchModule.legacySearchURLMiddleware);
    isLegacySearchURLMock = vi.mocked(legacySearchModule.isLegacySearchURL);
    rateLimitMock = vi.mocked((await import('@/rateLimit')).rateLimit);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...baseEnv, ADS_SESSION_COOKIE_NAME: 'ads_session' };
    getIronSessionMock.mockResolvedValue({
      token: { access_token: 'token' },
      isAuthenticated: true,
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    isLegacySearchURLMock.mockReturnValue(false);
    rateLimitMock.mockReturnValue(true);
  });

  afterEach(() => {
    process.env = { ...baseEnv };
    vi.clearAllMocks();
  });

  const makeReq = (url: string, init?: RequestInit) => new NextRequest(url, init);

  it('hydrates root path without redirect', async () => {
    const session = { save: vi.fn(), destroy: vi.fn(), updateConfig: vi.fn() };
    getIronSessionMock.mockResolvedValue(session);
    const req = makeReq('https://example.com/');
    const res = await middleware(req);
    expect(initSessionMock).toHaveBeenCalledWith(req, expect.any(NextResponse), session);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated protected routes to login with next param', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: false,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/libraries');
    const res = (await middleware(req)) as NextResponse;
    const location = res.headers.get('location');
    expect(res.status).toBe(307);
    expect(location).toContain('/user/account/login');
    expect(location).toContain('notify=login-required');
    expect(location).toContain('next=%252Fuser%252Flibraries');
  });

  it('allows authenticated protected routes to continue', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: true,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/settings');
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('routes verify endpoints through verifyMiddleware', async () => {
    const req = makeReq('https://example.com/user/account/verify/change-email/token123');
    await middleware(req);
    expect(verifyMiddlewareMock).toHaveBeenCalled();
  });

  it('redirects legacy search URLs via legacySearchURLMiddleware', async () => {
    isLegacySearchURLMock.mockReturnValue(true);
    const req = makeReq('https://example.com/search/q=foo');
    await middleware(req);
    expect(legacySearchMiddlewareMock).toHaveBeenCalled();
  });

  it('skips auth middleware for Next.js data prefetch routes', async () => {
    const req = {
      method: 'GET',
      nextUrl: {
        pathname: '/_next/data/build-id/search.json',
        toString: (): string => 'https://example.com/_next/data/build-id/search.json',
      },
      headers: new Headers(),
      cookies: { get: (): undefined => undefined },
    } as unknown as NextRequest;
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
    expect(getIronSessionMock).not.toHaveBeenCalled();
    expect(initSessionMock).not.toHaveBeenCalled();
    expect(rateLimitMock).not.toHaveBeenCalled();
  });

  it('redirects to / when session token is missing after initSession', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: false,
      token: undefined,
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/search');
    const res = (await middleware(req)) as NextResponse;
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/?notify=api-connect-failed');
  });

  it('login route: redirects authenticated users to decoded relative next param', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: true,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/account/login?next=%2Fuser%2Fsettings');
    const res = (await middleware(req)) as NextResponse;
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://example.com/user/settings?notify=account-login-success');
  });

  it('login route: redirects authenticated users to / when next param is external', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: true,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/account/login?next=https%3A%2F%2Fevil.example%2Fpwn');
    const res = (await middleware(req)) as NextResponse;
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://example.com/?notify=account-login-success');
  });

  it('login route: redirects authenticated users to / when next param is missing', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: true,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/account/login');
    const res = (await middleware(req)) as NextResponse;
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://example.com/');
  });

  it('login route: allows unauthenticated users to continue', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: false,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/account/login');
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('register route: redirects authenticated users to /', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: true,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/account/register');
    const res = (await middleware(req)) as NextResponse;
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://example.com/');
  });

  it('register route: allows unauthenticated users to continue', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: false,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/account/register');
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('forgot password route: redirects authenticated users to /', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: true,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/forgotpassword');
    const res = (await middleware(req)) as NextResponse;
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://example.com/');
  });

  it('forgot password route: allows unauthenticated users to continue', async () => {
    getIronSessionMock.mockResolvedValue({
      isAuthenticated: false,
      token: { access_token: 'token' },
      save: vi.fn(),
      destroy: vi.fn(),
      updateConfig: vi.fn(),
    });
    const req = makeReq('https://example.com/user/forgotpassword');
    const res = await middleware(req);
    expect(res.headers.get('location')).toBeNull();
  });

  it('rewrites abs identifiers to canonical form', async () => {
    const req = makeReq('https://example.com/abs/123/456');
    const res = await middleware(req);
    expect(res.headers.get('x-middleware-rewrite')).toContain('/abs/123%2F456/abstract');
  });

  it('emits analytics for abs paths when BASE_URL is set', async () => {
    process.env.BASE_URL = 'https://base.example.com';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 200 }) as Response);
    const req = makeReq('https://example.com/abs/123%2F456/abstract');
    await middleware(req);
    expect(fetchSpy).toHaveBeenCalledWith('https://base.example.com/link_gateway/123%2F456/abstract', {
      method: 'GET',
    });
    fetchSpy.mockRestore();
  });

  it('routes analytics calls through msw when BASE_URL is configured', async () => {
    process.env.BASE_URL = 'https://base.example.com';
    const requests: string[] = [];
    server.use(
      rest.get('https://base.example.com/link_gateway/:identifier/:view', (req, res, ctx) => {
        requests.push(req.url.toString());
        return res(ctx.status(200));
      }),
    );

    const waitForAnalytics = () =>
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Analytics request not observed')), 500);
        const onMatch = (req: MockedRequest) => {
          if (req.url.href.includes('/link_gateway/789/abstract')) {
            clearTimeout(timeout);
            server.events.removeListener('request:match', onMatch);
            resolve();
          }
        };
        server.events.on('request:match', onMatch);
      });

    const req = makeReq('https://example.com/abs/789/abstract');
    const requestPromise = waitForAnalytics();
    await middleware(req);
    await requestPromise;

    expect(requests[0]).toBe('https://base.example.com/link_gateway/789/abstract');
  });

  it('honors rate limiting and short-circuits', async () => {
    rateLimitMock.mockReturnValue(false);
    const req = makeReq('https://example.com/search');
    const res = (await middleware(req)) as NextResponse;
    expect(res.headers.get('location')).toContain('notify=rate-limit-exceeded');
  });
});
