import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { rest } from 'msw';
import { verifyMiddleware } from '@/middlewares/verifyMiddleware';
import { server } from '@/mocks/server';

describe('verifyMiddleware', () => {
  const baseEnv = { ...process.env };
  const cookieName = 'ads_session';

  beforeEach(() => {
    process.env.API_HOST_SERVER = 'https://api.example.com';
    process.env.ADS_SESSION_COOKIE_NAME = cookieName;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...baseEnv };
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  const makeReq = (path: string) =>
    new NextRequest(`https://example.com${path}`, {
      headers: {
        cookie: `${cookieName}=cookie-value`,
      },
    });

  const makeSession = (hasToken = true) => ({
    token: hasToken
      ? {
          access_token: 'token',
          anonymous: false,
          expires_at: `${Math.floor(Date.now() / 1000) + 3600}`,
          username: 'test@example.com',
        }
      : undefined,
    save: vi.fn(),
    destroy: vi.fn(),
    updateConfig: vi.fn(),
  });

  const mockFetch = (body: Record<string, unknown>, status = 200, headers?: HeadersInit) =>
    vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body), { status, headers }) as unknown as Response);

  it('redirects to login with success notify when verification succeeds', async () => {
    const session = makeSession();
    const fetchSpy = mockFetch({ message: 'success' }, 200, { 'set-cookie': `${cookieName}=new-value` });
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next(), session);
    const location = (res as NextResponse).headers.get('location');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(location).toContain('/user/account/login');
    expect(location).toContain('notify=verify-account-success');
  });

  it('redirects with failure when access token is missing', async () => {
    const session = makeSession(false);
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next(), session);
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });

  it('handles unknown verification token error', async () => {
    const session = makeSession();
    mockFetch({ error: 'unknown verification token' });
    const res = await verifyMiddleware(
      makeReq('/user/account/verify/change-email/bad-token'),
      NextResponse.next(),
      session,
    );
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });

  it('handles already validated token error', async () => {
    const session = makeSession();
    mockFetch({ error: 'already been validated' });
    const res = await verifyMiddleware(
      makeReq('/user/account/verify/change-email/reused'),
      NextResponse.next(),
      session,
    );
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-was-valid');
  });

  it('redirects with failure on non-200 responses', async () => {
    const session = makeSession();
    mockFetch({ error: 'server error' }, 500);
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next(), session);
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });

  it('redirects with failure when fetch throws', async () => {
    const session = makeSession();
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next(), session);
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });

  it('forwards tracing headers to the verify API', async () => {
    const session = makeSession();
    const fetchSpy = mockFetch({ message: 'success' });
    const req = new NextRequest('https://example.com/user/account/verify/change-email/tok', {
      headers: {
        cookie: `${cookieName}=cookie-value`,
        'X-Amzn-Trace-Id': 'Root=1-abc-def',
        'X-Forwarded-For': '10.0.0.1',
      },
    });

    await verifyMiddleware(req, NextResponse.next(), session);

    const fetchCall = fetchSpy.mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers.get('X-Amzn-Trace-Id')).toBe('Root=1-abc-def');
    expect(headers.get('X-Forwarded-For')).toBe('10.0.0.1');
  });

  describe('msw contract coverage', () => {
    it('calls the verify API with bearer and session cookie and forwards Set-Cookie', async () => {
      const setCookieValue = `${cookieName}=verified; Domain=example.com; Secure; Path=/; SameSite=None; HttpOnly`;
      let authHeader: string | null = null;
      let cookieHeader: string | null = null;

      server.use(
        rest.get('https://api.example.com/accounts/verify/:token', (req, res, ctx) => {
          authHeader = req.headers.get('authorization');
          cookieHeader = req.headers.get('cookie');
          return res(
            ctx.status(200),
            (ctx.set as (name: string, value: string) => never)('set-cookie', setCookieValue),
            ctx.json({ message: 'success' }),
          );
        }),
      );

      const session = makeSession();
      const initialResponse = NextResponse.next();
      const res = await verifyMiddleware(makeReq('/user/account/verify/register/msw-token'), initialResponse, session);
      const location = (res as NextResponse).headers.get('location');

      expect(authHeader).toBe('Bearer token');
      expect(cookieHeader).toContain(`${cookieName}=cookie-value`);
      expect(initialResponse.headers.get('set-cookie')).toContain(`${cookieName}=verified`);
      expect(location).toContain('notify=verify-account-success');
    });

    it('maps API error payloads from msw', async () => {
      server.use(
        rest.get('https://api.example.com/accounts/verify/:token', (_req, res, ctx) =>
          res(ctx.status(200), ctx.json({ error: 'already been validated' })),
        ),
      );

      const session = makeSession();
      const res = await verifyMiddleware(
        makeReq('/user/account/verify/change-email/msw-bad'),
        NextResponse.next(),
        session,
      );
      expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-was-valid');
    });
  });
});
