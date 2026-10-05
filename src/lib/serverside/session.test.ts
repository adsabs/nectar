import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ACCESS_TOKEN_HEADER, resolveServerSession } from './session';

const SEALED = 'sealed-cookie-value';
const COOKIE_TOKEN = 'token-from-cookie';
const HEADER_TOKEN = 'token-from-header';

const mocks = vi.hoisted(() => ({ unsealData: vi.fn() }));

vi.mock('iron-session', () => ({ unsealData: mocks.unsealData }));

beforeEach(() => {
  mocks.unsealData.mockReset();
  process.env.COOKIE_SECRET = 'test-secret';
});

describe('resolveServerSession', () => {
  test('returns the token sealed in the session cookie', async () => {
    mocks.unsealData.mockResolvedValue({ token: { access_token: COOKIE_TOKEN } });

    const { token } = await resolveServerSession(SEALED, null);

    expect(token).toBe(COOKIE_TOKEN);
  });

  test('returns the decoded session alongside the token', async () => {
    const session = { token: { access_token: COOKIE_TOKEN, anonymous: false, expires_at: '1', username: 'a' } };
    mocks.unsealData.mockResolvedValue(session);

    const result = await resolveServerSession(SEALED, null);

    expect(result.session).toEqual(session);
  });

  // The header is a fallback for requests whose cookie isn't written yet,
  // never an override of a cookie the server already trusts.
  test('prefers the cookie token over the forwarded header', async () => {
    mocks.unsealData.mockResolvedValue({ token: { access_token: COOKIE_TOKEN } });

    const { token } = await resolveServerSession(SEALED, HEADER_TOKEN);

    expect(token).toBe(COOKIE_TOKEN);
  });

  test('falls back to the forwarded header when there is no cookie', async () => {
    const { token } = await resolveServerSession(undefined, HEADER_TOKEN);

    expect(token).toBe(HEADER_TOKEN);
    expect(mocks.unsealData).not.toHaveBeenCalled();
  });

  test('falls back to the forwarded header when the cookie carries no token', async () => {
    mocks.unsealData.mockResolvedValue({});

    const { token } = await resolveServerSession(SEALED, HEADER_TOKEN);

    expect(token).toBe(HEADER_TOKEN);
  });

  // A tampered or stale cookie must degrade to "no session", not throw inside a
  // server component and take the whole document with it.
  test('treats an undecryptable cookie as no session', async () => {
    mocks.unsealData.mockRejectedValue(new Error('bad seal'));

    await expect(resolveServerSession(SEALED, null)).resolves.toEqual({ session: undefined, token: undefined });
  });

  test('still uses the header when the cookie fails to decrypt', async () => {
    mocks.unsealData.mockRejectedValue(new Error('bad seal'));

    const { token } = await resolveServerSession(SEALED, HEADER_TOKEN);

    expect(token).toBe(HEADER_TOKEN);
  });

  test('reports no token when neither source has one', async () => {
    await expect(resolveServerSession(undefined, null)).resolves.toEqual({ session: undefined, token: undefined });
  });

  test('normalises a missing header to undefined rather than null', async () => {
    const { token } = await resolveServerSession(undefined, null);

    expect(token).toBeUndefined();
  });

  test('names the header middleware actually sets', () => {
    expect(ACCESS_TOKEN_HEADER).toBe('x-scix-access-token');
  });
});
