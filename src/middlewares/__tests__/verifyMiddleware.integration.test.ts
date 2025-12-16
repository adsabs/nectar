import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { verifyMiddleware } from '@/middlewares/verifyMiddleware';
import { getIronSession } from 'iron-session/edge';

vi.mock('iron-session/edge', async (orig) => {
  const actual = await orig<typeof import('iron-session/edge')>();
  return { ...actual, getIronSession: vi.fn() };
});

describe('verifyMiddleware', () => {
  const getIronSessionMock = getIronSession as unknown as ReturnType<typeof vi.fn>;
  const baseEnv = { ...process.env };
  const cookieName = 'ads_session';

  beforeEach(() => {
    process.env.API_HOST_SERVER = 'https://api.example.com';
    process.env.ADS_SESSION_COOKIE_NAME = cookieName;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...baseEnv };
    vi.clearAllMocks();
  });

  const makeReq = (path: string) =>
    new NextRequest(`https://example.com${path}`, {
      headers: {
        cookie: `${cookieName}=cookie-value`,
      },
    });

  const makeSession = (hasToken = true) => ({
    token: hasToken ? { access_token: 'token' } : undefined,
    save: vi.fn(),
    destroy: vi.fn(),
    updateConfig: vi.fn(),
  });

  const mockFetch = (body: Record<string, unknown>, status = 200, headers?: HeadersInit) =>
    vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body), { status, headers }) as unknown as Response);

  it('redirects to login with success notify when verification succeeds', async () => {
    getIronSessionMock.mockResolvedValue(makeSession());
    const fetchSpy = mockFetch({ message: 'success' }, 200, { 'set-cookie': `${cookieName}=new-value` });
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next());
    const location = (res as NextResponse).headers.get('location');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(location).toContain('/user/account/login');
    expect(location).toContain('notify=verify-account-success');
  });

  it('redirects with failure when access token is missing', async () => {
    getIronSessionMock.mockResolvedValue(makeSession(false));
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next());
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });

  it('handles unknown verification token error', async () => {
    getIronSessionMock.mockResolvedValue(makeSession());
    mockFetch({ error: 'unknown verification token' });
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/bad-token'), NextResponse.next());
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });

  it('handles already validated token error', async () => {
    getIronSessionMock.mockResolvedValue(makeSession());
    mockFetch({ error: 'already been validated' });
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/reused'), NextResponse.next());
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-was-valid');
  });

  it('redirects with failure on non-200 responses', async () => {
    getIronSessionMock.mockResolvedValue(makeSession());
    mockFetch({ error: 'server error' }, 500);
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next());
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });

  it('redirects with failure when fetch throws', async () => {
    getIronSessionMock.mockResolvedValue(makeSession());
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const res = await verifyMiddleware(makeReq('/user/account/verify/change-email/abc'), NextResponse.next());
    expect((res as NextResponse).headers.get('location')).toContain('notify=verify-account-failed');
  });
});
