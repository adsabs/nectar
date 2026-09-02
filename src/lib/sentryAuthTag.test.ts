import { afterEach, describe, expect, test, vi } from 'vitest';

import { authTagForSession, authTagForUser, readAuthTag } from '@/lib/sentryAuthTag';

describe('authTagForSession', () => {
  test('tags an authenticated session as authed', () => {
    expect(authTagForSession(true)).toBe('authed');
  });

  test('tags an unauthenticated session as anon', () => {
    expect(authTagForSession(false)).toBe('anon');
  });
});

describe('authTagForUser', () => {
  test('treats a bootstrapped anonymous user as anon', () => {
    expect(authTagForUser({ anonymous: true })).toBe('anon');
  });

  test('treats a bootstrapped named user as authed', () => {
    expect(authTagForUser({ anonymous: false })).toBe('authed');
  });

  test.each([[null], [undefined], [{}]])('treats %o as anon', (user) => {
    expect(authTagForUser(user)).toBe('anon');
  });
});

describe('readAuthTag', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('reads the tag from the scix_auth cookie', () => {
    expect(readAuthTag('scix_auth=authed')).toBe('authed');
  });

  test('finds the cookie among others', () => {
    expect(readAuthTag('scix_prefs=%7B%7D; scix_auth=authed; other=1')).toBe('authed');
  });

  test('defaults to anon when the cookie is absent', () => {
    expect(readAuthTag('scix_prefs=%7B%7D')).toBe('anon');
  });

  test.each(['scix_auth=', 'scix_auth=bogus', 'scix_auth=AUTHED'])(
    'defaults to anon for the unrecognized value %o',
    (cookie) => {
      expect(readAuthTag(cookie)).toBe('anon');
    },
  );

  test('defaults to anon when there is no document (SSR)', () => {
    vi.stubGlobal('document', undefined);

    expect(readAuthTag()).toBe('anon');
  });

  test('reads document.cookie when no source is passed', () => {
    vi.stubGlobal('document', { cookie: 'scix_auth=authed' });

    expect(readAuthTag()).toBe('authed');
  });
});
