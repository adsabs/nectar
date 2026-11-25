import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { webcrypto } from 'crypto';
import { normalizeAbsPath } from '@/middleware';
import { isAuthenticated, isTokenExpired, isUserData, isValidToken, hash } from '@/middlewares/initSession';
import { isLegacySearchURL, legacySearchURLMiddleware } from '@/middlewares/legacySearchURLMiddleware';
import { isFromLegacyApp } from '@/utils/legacyAppDetection';
import { extractToken } from '@/middlewares/verifyMiddleware';

describe('normalizeAbsPath', () => {
  test('returns shouldRewrite=false for non-abs paths or insufficient segments', () => {
    expect(normalizeAbsPath('/search')).toEqual({ shouldRewrite: false });
    expect(normalizeAbsPath('/abs/123')).toEqual({ shouldRewrite: false });
  });

  test('rewrites multi-part identifiers without explicit view', () => {
    const result = normalizeAbsPath('/abs/123/456');
    expect(result).toEqual({
      shouldRewrite: true,
      rewrittenPath: '/abs/123%2F456/abstract',
      rawIdentifier: '123/456',
      view: 'abstract',
    });
  });

  test('rewrites known view paths with multi-part IDs', () => {
    const result = normalizeAbsPath('/abs/123/456/abstract');
    expect(result).toEqual({
      shouldRewrite: true,
      rewrittenPath: '/abs/123%2F456/abstract',
      rawIdentifier: '123/456',
      view: 'abstract',
    });
  });

  test('handles exportcitation special-case view', () => {
    const result = normalizeAbsPath('/abs/123/456/exportcitation/csl');
    expect(result).toEqual({
      shouldRewrite: true,
      rewrittenPath: '/abs/123%2F456/exportcitation/csl',
      rawIdentifier: '123/456',
      view: 'exportcitation/csl',
    });
  });

  test('preserves already-encoded identifiers', () => {
    const result = normalizeAbsPath('/abs/123%2F456/abstract');
    expect(result).toEqual({ shouldRewrite: false });
  });
});

describe('session helpers', () => {
  beforeAll(() => {
    if (!globalThis.crypto?.subtle) {
      // Ensure SubtleCrypto is available in the test environment
      Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isUserData', () => {
    test('validates presence of required fields', () => {
      const validUser = {
        access_token: 'token',
        expires_at: '9999999999',
        username: 'user',
        anonymous: false,
      };
      expect(isUserData(validUser)).toBe(true);
      expect(
        isUserData({
          ...validUser,
          access_token: '',
        }),
      ).toBe(false);
      expect(isUserData(undefined)).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    test('returns false when expiry is in the future and true when in the past', () => {
      vi.setSystemTime(new Date('2023-01-01T00:00:00Z'));
      const nowSeconds = Math.floor(new Date('2023-01-01T00:00:00Z').getTime() / 1000);
      expect(isTokenExpired(String(nowSeconds + 10))).toBe(false);
      expect(isTokenExpired(String(nowSeconds))).toBe(true);
      expect(isTokenExpired(String(nowSeconds - 10))).toBe(true);
    });
  });

  describe('isValidToken', () => {
    test('requires valid user data and non-expired token', () => {
      const validUser = {
        access_token: 'token',
        expires_at: `${Math.floor(Date.now() / 1000) + 60}`,
        username: 'user',
        anonymous: false,
      };
      expect(isValidToken(validUser)).toBe(true);
      expect(isValidToken({ ...validUser, expires_at: `${Math.floor(Date.now() / 1000) - 1}` })).toBe(false);
      expect(isValidToken({ ...validUser, access_token: '' })).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    test('treats non-anonymous or non-default anonymous users as authenticated', () => {
      const baseUser = {
        access_token: 'token',
        expires_at: '9999999999',
        username: 'user',
        anonymous: false,
      };
      expect(isAuthenticated(baseUser)).toBe(true);
      expect(isAuthenticated({ ...baseUser, anonymous: true, username: 'anonymous@ads' })).toBe(false);
      expect(isAuthenticated({ ...baseUser, anonymous: true, username: 'other-anon' })).toBe(true);
    });
  });

  describe('hash', () => {
    test('returns SHA-1 hex digest for a string', async () => {
      await expect(hash('abc')).resolves.toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    });

    test('returns empty string for empty input', async () => {
      await expect(hash('')).resolves.toBe('');
      await expect(hash()).resolves.toBe('');
    });

    test('returns empty string when digest throws', async () => {
      const digestSpy = vi.spyOn(globalThis.crypto.subtle, 'digest').mockRejectedValueOnce(new Error('boom'));
      await expect(hash('abc')).resolves.toBe('');
      digestSpy.mockRestore();
    });
  });
});

describe('legacy search helpers', () => {
  test('detects legacy /search paths that should redirect', () => {
    expect(isLegacySearchURL(new NextRequest('https://example.com/search/q=star'))).toBe(true);
    expect(isLegacySearchURL(new NextRequest('https://example.com/search/'))).toBe(false);
    expect(isLegacySearchURL(new NextRequest('https://example.com/search/exportcitation'))).toBe(false);
    expect(isLegacySearchURL(new NextRequest('https://example.com/abs/123'))).toBe(false);
  });

  test('redirects legacy /search paths to canonical query string', () => {
    const req = new NextRequest('https://example.com/search/q=foo+bar&fl=abstract');
    const res = legacySearchURLMiddleware(req);

    const location = res.headers.get('Location');
    expect(location).toBe('https://example.com/search?q=foo+bar&fl=abstract');

    const redirected = new URL(location!);
    expect(redirected.pathname).toBe('/search');
    expect(redirected.searchParams.get('q')).toBe('foo bar');
    expect(redirected.searchParams.get('fl')).toBe('abstract');
  });

  test('keeps a sub-route that trails the legacy param list', () => {
    const req = new NextRequest('https://example.com/search/q=star&sort=date%20desc/metrics');
    const redirected = new URL(legacySearchURLMiddleware(req).headers.get('Location')!);

    expect(redirected.pathname).toBe('/search/metrics');
    expect(redirected.searchParams.get('q')).toBe('star');
    expect(redirected.searchParams.get('sort')).toBe('date desc');
  });

  test('translates a bumblebee visualization sub-route', () => {
    const req = new NextRequest('https://example.com/search/q=star/show-paper-network');
    const redirected = new URL(legacySearchURLMiddleware(req).headers.get('Location')!);

    expect(redirected.pathname).toBe('/search/paper_network');
    expect(redirected.searchParams.get('q')).toBe('star');
  });

  test('keeps an export format on the exportcitation sub-route', () => {
    const req = new NextRequest('https://example.com/search/q=star/export-bibtex');
    const redirected = new URL(legacySearchURLMiddleware(req).headers.get('Location')!);

    expect(redirected.pathname).toBe('/search/exportcitation/bibtex');
    expect(redirected.searchParams.get('q')).toBe('star');
  });

  test('converts the zero-based p_ index the same way the hash form does', () => {
    const req = new NextRequest('https://example.com/search/q=star&p_=2');
    const redirected = new URL(legacySearchURLMiddleware(req).headers.get('Location')!);

    expect(redirected.searchParams.get('p')).toBe('3');
    expect(redirected.searchParams.has('p_')).toBe(false);
  });

  test('leaves slashes inside a param value alone when there is no sub-route', () => {
    const req = new NextRequest('https://example.com/search/q=doi:10.1093/mnras/stz1234');
    const redirected = new URL(legacySearchURLMiddleware(req).headers.get('Location')!);

    expect(redirected.pathname).toBe('/search');
    expect(redirected.searchParams.get('q')).toBe('doi:10.1093/mnras/stz1234');
  });
});

describe('referer helpers', () => {
  test('identifies referers from legacy app domains', () => {
    expect(isFromLegacyApp('https://ui.adsabs.harvard.edu/search')).toBe(true);
    expect(isFromLegacyApp('https://devui.adsabs.harvard.edu/search')).toBe(true);
    expect(isFromLegacyApp('https://qa.adsabs.harvard.edu/search')).toBe(true);
    expect(isFromLegacyApp('https://dev.adsabs.harvard.edu/search')).toBe(true);
  });

  test('returns false for missing or invalid referer', () => {
    expect(isFromLegacyApp()).toBe(false);
    expect(isFromLegacyApp('')).toBe(false);
    expect(isFromLegacyApp(':::::')).toBe(false);
    expect(isFromLegacyApp('https://google.com')).toBe(false);
  });
});

describe('extractToken', () => {
  test('extracts route and token segments from verification path', () => {
    expect(extractToken('/user/account/verify/change-email/abc123')).toEqual({
      route: 'change-email',
      token: 'abc123',
    });
    expect(extractToken('/user/account/verify/register/token-456')).toEqual({
      route: 'register',
      token: 'token-456',
    });
  });

  test('returns empty strings for non-string paths', () => {
    expect(extractToken(undefined as unknown as string)).toEqual({ route: '', token: '' });
  });
});
