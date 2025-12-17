import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { rest } from 'msw';
import { webcrypto } from 'crypto';
import { server } from '@/mocks/server';
import { initSession, hash } from '@/middlewares/initSession';

vi.mock('@/middlewares/botCheck', () => ({
  botCheck: vi.fn().mockResolvedValue(undefined),
}));

type IronSessionMock = {
  token?: {
    access_token: string;
    expires_at: string;
    username: string;
    anonymous: boolean;
  };
  apiCookieHash?: string;
  isAuthenticated?: boolean;
  bot?: boolean;
  save: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  updateConfig: ReturnType<typeof vi.fn>;
};

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

describe('initSession msw contracts', () => {
  const originalEnv = { ...process.env };
  const cookieName = 'ads_session';

  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
    }
  });

  beforeEach(() => {
    process.env.ADS_SESSION_COOKIE_NAME = cookieName;
    process.env.API_HOST_SERVER = 'https://api.example.com';
    process.env.NEXT_PUBLIC_API_MOCKING = '';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it('hydrates from the bootstrap API and rewrites cookie attributes', async () => {
    const bootstrapCookie = `${cookieName}=rotated; Domain=.example.com; SameSite=None; HttpOnly; Secure; Path=/; Max-Age=3600`;
    const expiresAt = `${Math.floor(Date.now() / 1000) + 600}`;
    let receivedCookie: string | null = null;

    server.use(
      rest.get('https://api.example.com/accounts/bootstrap', (req, res, ctx) => {
        receivedCookie = req.headers.get('cookie');
        return res(
          ctx.status(200),
          ctx.set('set-cookie', bootstrapCookie),
          ctx.json({
            username: 'contract@example.com',
            scopes: [],
            client_id: 'client',
            access_token: 'rotated-token',
            client_name: 'client-name',
            token_type: 'Bearer',
            ratelimit: 1,
            anonymous: false,
            client_secret: 'secret',
            expires_at: expiresAt,
            refresh_token: 'refresh',
            given_name: 'Test',
            family_name: 'User',
          }),
        );
      }),
    );

    const session = createSession({ apiCookieHash: 'stale' });
    const req = new NextRequest('https://app.example.com/search', {
      headers: { cookie: `${cookieName}=old-cookie` },
    });
    const res = NextResponse.next();

    await initSession(req, res, session as never);

    const updatedCookie = res.cookies.get(cookieName);
    expect(receivedCookie).toContain(`${cookieName}=old-cookie`);
    expect(updatedCookie?.value).toBe('rotated');
    expect(updatedCookie?.sameSite).toBe('lax');
    expect(updatedCookie?.path).toBe('/');
    expect(updatedCookie?.httpOnly).toBe(true);
    expect(session.token?.access_token).toBe('rotated-token');
    expect(session.apiCookieHash).toBe(await hash('rotated'));
  });

  it('avoids setting Set-Cookie when the API returns the same cookie value', async () => {
    const expiresAt = `${Math.floor(Date.now() / 1000) + 600}`;
    server.use(
      rest.get('https://api.example.com/accounts/bootstrap', (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.set(
            'set-cookie',
            `${cookieName}=unchanged; Domain=.example.com; SameSite=None; HttpOnly; Secure; Path=/; Max-Age=3600`,
          ),
          ctx.json({
            username: 'contract@example.com',
            scopes: [],
            client_id: 'client',
            access_token: 'unchanged-token',
            client_name: 'client-name',
            token_type: 'Bearer',
            ratelimit: 1,
            anonymous: false,
            client_secret: 'secret',
            expires_at: expiresAt,
            refresh_token: 'refresh',
            given_name: 'Test',
            family_name: 'User',
          }),
        ),
      ),
    );

    const session = createSession({ apiCookieHash: 'stale' });
    const req = new NextRequest('https://app.example.com/search', {
      headers: { cookie: `${cookieName}=unchanged` },
    });
    const res = NextResponse.next();

    await initSession(req, res, session as never);

    expect(res.cookies.get(cookieName)).toBeUndefined();
    expect(session.token?.access_token).toBe('unchanged-token');
    expect(session.apiCookieHash).toBe(await hash('unchanged'));
  });
});
