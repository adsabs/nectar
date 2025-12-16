import { beforeAll, beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { webcrypto } from 'crypto';
import { initSession, isValidToken, hash } from '@/middlewares/initSession';

const botCheckMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/middlewares/botCheck', () => ({
  botCheck: botCheckMock,
}));

describe('initSession integration', () => {
  const ORIGINAL_ENV = { ...process.env };
  const cookieName = 'ads_session';

  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      // Ensure SubtleCrypto is available in the test environment
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
    }
  });

  beforeEach(() => {
    process.env.ADS_SESSION_COOKIE_NAME = cookieName;
    process.env.API_HOST_SERVER = 'https://api.example.com';
    process.env.NEXT_PUBLIC_API_MOCKING = '';
    vi.restoreAllMocks();
    botCheckMock.mockClear();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  const createSession = (overrides: Partial<IronSessionMock> = {}): IronSessionMock => ({
    token: undefined,
    apiCookieHash: '',
    isAuthenticated: false,
    bot: false,
    save: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    updateConfig: vi.fn(),
    ...overrides,
  });

  type IronSessionMock = {
    token?: {
      access_token: string;
      expires_at: string;
      username: string;
      anonymous: boolean;
    } | null;
    apiCookieHash?: string;
    isAuthenticated?: boolean;
    bot?: boolean;
    save: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
    updateConfig: ReturnType<typeof vi.fn>;
  };

  const bootstrapPayload = {
    access_token: 'new-token',
    username: 'user@example.com',
    anonymous: false,
    expires_at: `${Math.floor(Date.now() / 1000) + 3600}`,
  };

  const makeBootstrapResponse = (cookieValue: string) =>
    new Response(JSON.stringify(bootstrapPayload), {
      status: 200,
      headers: {
        'set-cookie': `${cookieName}=${cookieValue}; Domain=example.com; SameSite=None; HttpOnly; Secure; Path=/; Max-Age=3600`,
        'content-type': 'application/json',
      },
    });

  it('uses fast path when token is valid and hash matches', async () => {
    const cookieValue = 'abc123';
    const cookieHash = await hash(cookieValue);
    const session = createSession({
      token: {
        access_token: 'token',
        expires_at: `${Math.floor(Date.now() / 1000) + 300}`,
        username: 'user',
        anonymous: false,
      },
      apiCookieHash: cookieHash,
      isAuthenticated: true,
    });

    const req = new NextRequest('https://example.com/search', {
      headers: {
        cookie: `${cookieName}=${cookieValue}`,
      },
    });
    const res = NextResponse.next();

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await initSession(req, res, session as never);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(botCheckMock).not.toHaveBeenCalled();
    expect(session.save).not.toHaveBeenCalled();
    expect(isValidToken(session.token || undefined)).toBe(true);
    expect(session.apiCookieHash).toBe(cookieHash);
  });

  it('hydrates session on slow path and rewrites session cookie', async () => {
    process.env.NEXT_PUBLIC_API_MOCKING = 'enabled';
    const session = createSession({
      token: {
        access_token: 'expired',
        expires_at: `${Math.floor(Date.now() / 1000) - 10}`,
        username: 'user',
        anonymous: false,
      },
      apiCookieHash: 'stale',
    });

    const req = new NextRequest('https://example.com/search', {
      headers: {
        cookie: `${cookieName}=old-value`,
      },
    });
    const res = NextResponse.next();

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({} as Response);

    await initSession(req, res, session as never);

    expect(botCheckMock).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled(); // mock path bypasses network
    expect(session.save).toHaveBeenCalledTimes(1);

    const updatedCookie = res.cookies.get(cookieName);
    expect(updatedCookie?.value).toBe('mocked');
    expect(session.token?.access_token).toBe('mocked');
    expect(session.isAuthenticated).toBe(true);
    expect(session.apiCookieHash).toBe(await hash('mocked'));
  });

  it('leaves session untouched when bootstrap fails', async () => {
    process.env.NEXT_PUBLIC_API_MOCKING = '';
    const session = createSession({
      token: {
        access_token: 'expired',
        expires_at: `${Math.floor(Date.now() / 1000) - 10}`,
        username: 'user',
        anonymous: false,
      },
      apiCookieHash: 'stale',
    });

    const req = new NextRequest('https://example.com/search', {
      headers: {
        cookie: `${cookieName}=old-value`,
      },
    });
    const res = NextResponse.next();

    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network failed'));

    await initSession(req, res, session as never);

    expect(botCheckMock).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(session.save).not.toHaveBeenCalled();
    expect(res.cookies.get(cookieName)).toBeUndefined();
    expect(session.token?.access_token).toBe('expired');
    expect(session.apiCookieHash).toBe('stale');
  });

  it('forces slow path when refresh header present even with valid token', async () => {
    const cookieValue = 'abc123';
    const session = createSession({
      token: {
        access_token: 'valid',
        expires_at: `${Math.floor(Date.now() / 1000) + 300}`,
        username: 'user',
        anonymous: false,
      },
      apiCookieHash: await hash(cookieValue),
      isAuthenticated: true,
    });

    const req = new NextRequest('https://example.com/search', {
      headers: {
        cookie: `${cookieName}=${cookieValue}`,
        'x-refresh-token': '1',
      },
    });
    const res = NextResponse.next();

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(makeBootstrapResponse('new-cookie') as Response);

    await initSession(req, res, session as never);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(botCheckMock).toHaveBeenCalledTimes(1);
    expect(session.save).toHaveBeenCalledTimes(1);
    expect(session.token?.access_token).toBe(bootstrapPayload.access_token);
    expect(session.apiCookieHash).toBe(await hash('new-cookie'));
    const setCookie = res.cookies.get(cookieName);
    expect(setCookie?.value).toBe('new-cookie');
    expect(setCookie?.sameSite).toBe('lax');
    expect(setCookie?.httpOnly).toBe(true);
    expect(setCookie?.secure).toBe(true);
    expect(setCookie?.path).toBe('/');
  });

  it('does not set response cookie when API cookie value is unchanged', async () => {
    const cookieValue = 'unchanged';
    const session = createSession({
      token: {
        access_token: 'valid',
        expires_at: `${Math.floor(Date.now() / 1000) - 10}`,
        username: 'user',
        anonymous: false,
      },
      apiCookieHash: 'old-hash',
    });

    const req = new NextRequest('https://example.com/search', {
      headers: {
        cookie: `${cookieName}=${cookieValue}`,
      },
    });
    const res = NextResponse.next();

    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(makeBootstrapResponse(cookieValue) as Response);

    await initSession(req, res, session as never);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(session.save).toHaveBeenCalledTimes(1);
    expect(res.cookies.get(cookieName)).toBeUndefined();
    expect(session.apiCookieHash).toBe(await hash(cookieValue));
  });
});
