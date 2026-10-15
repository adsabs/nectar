import { beforeEach, describe, expect, test } from 'vitest';
import { APP_DEFAULTS } from '@/config';
import {
  hashSiteMsg,
  readDismissedMsgHash,
  readNumPerPagePref,
  readPrefsCookie,
  writePrefsCookie,
} from '../prefs-cookie';

describe('readPrefsCookie', () => {
  test('returns empty object when cookie source is empty', () => {
    expect(readPrefsCookie('')).toEqual({});
  });

  test('returns empty object when scix_prefs is not present', () => {
    expect(readPrefsCookie('other=val; another=val2')).toEqual({});
  });

  test('parses scix_prefs from cookie header string', () => {
    const prefs = { searchMode: 'ADS_COMPAT', mode: 'ASTROPHYSICS' };
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;
    expect(readPrefsCookie(cookie)).toEqual(prefs);
  });

  test('parses scix_prefs when surrounded by other cookies', () => {
    const prefs = { searchMode: 'ADS_COMPAT' };
    const cookie = `a=1; scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}; b=2`;
    expect(readPrefsCookie(cookie)).toEqual(prefs);
  });

  test('returns empty object on malformed JSON', () => {
    expect(readPrefsCookie(`scix_prefs=${encodeURIComponent('{bad')}`)).toEqual({});
  });

  test('returns empty object on malformed URI encoding', () => {
    expect(readPrefsCookie('scix_prefs=%zz')).toEqual({});
  });
});

describe('writePrefsCookie', () => {
  const written: string[] = [];

  beforeEach(() => {
    written.length = 0;
    Object.defineProperty(document, 'cookie', {
      get: () => written[written.length - 1]?.split(';')[0] ?? '',
      set: (val: string) => written.push(val),
      configurable: true,
    });
  });

  test('writes a URL-encoded JSON cookie', () => {
    writePrefsCookie({ searchMode: 'ADS_COMPAT' });
    expect(written).toHaveLength(1);
    const [pair] = written[0].split(';');
    const [, value] = pair.split('=');
    const parsed = JSON.parse(decodeURIComponent(value));
    expect(parsed.searchMode).toBe('ADS_COMPAT');
  });

  test('includes Max-Age, Path, and SameSite in the cookie string', () => {
    writePrefsCookie({ mode: 'ASTROPHYSICS' });
    expect(written[0]).toContain('Max-Age=');
    expect(written[0]).toContain('Path=/');
    expect(written[0]).toContain('SameSite=Lax');
  });

  test('omits undefined keys from the written cookie', () => {
    writePrefsCookie({ searchMode: 'ADS_COMPAT', mode: undefined });
    const [pair] = written[0].split(';');
    const [, value] = pair.split('=');
    const parsed = JSON.parse(decodeURIComponent(value));
    expect(parsed).not.toHaveProperty('mode');
  });

  test('writes a dismissal hash and preserves an unrelated pref', () => {
    writePrefsCookie({ numPerPage: 50 });
    writePrefsCookie({ dismissedMsg: hashSiteMsg('a site message') });

    const [pair] = written[1].split(';');
    const [, value] = pair.split('=');
    const parsed = JSON.parse(decodeURIComponent(value));
    expect(parsed.dismissedMsg).toBe(hashSiteMsg('a site message'));
    expect(parsed.numPerPage).toBe(50);
  });

  test('does not throw when called with an empty updates object', () => {
    expect(() => writePrefsCookie({})).not.toThrow();
  });

  test('writes a numeric numPerPage without dropping it as falsy', () => {
    writePrefsCookie({ numPerPage: 50 });
    const [pair] = written[0].split(';');
    const [, value] = pair.split('=');
    const parsed = JSON.parse(decodeURIComponent(value));
    expect(parsed.numPerPage).toBe(50);
  });

  test('retains existing keys when updating a different key (merge behaviour)', () => {
    // First write: set searchMode
    writePrefsCookie({ searchMode: 'ADS_COMPAT' });
    // The getter returns the last written pair so readPrefsCookie sees it
    expect(written).toHaveLength(1);

    // Second write: add mode — searchMode must survive
    writePrefsCookie({ mode: 'ASTROPHYSICS' });
    expect(written).toHaveLength(2);
    const [pair] = written[1].split(';');
    const [, value] = pair.split('=');
    const parsed = JSON.parse(decodeURIComponent(value));
    expect(parsed.searchMode).toBe('ADS_COMPAT');
    expect(parsed.mode).toBe('ASTROPHYSICS');
  });
});

// The server has no access to the zustand/localStorage numPerPage, so the
// prefs cookie is the only way GSSP can reproduce the client's `rows`.
describe('readNumPerPagePref', () => {
  const cookieFor = (prefs: Record<string, unknown>) => `scix_prefs=${encodeURIComponent(JSON.stringify(prefs))}`;

  test('returns a valid persisted numPerPage', () => {
    expect(readNumPerPagePref(cookieFor({ numPerPage: 50 }))).toBe(50);
  });

  test('returns the app default when the cookie is absent', () => {
    expect(readNumPerPagePref('')).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
  });

  test('returns the app default when numPerPage is missing from the cookie', () => {
    expect(readNumPerPagePref(cookieFor({ mode: 'ASTROPHYSICS' }))).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
  });

  test('rejects a value outside PER_PAGE_OPTIONS', () => {
    expect(readNumPerPagePref(cookieFor({ numPerPage: 7 }))).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
  });

  test('rejects a non-numeric value', () => {
    expect(readNumPerPagePref(cookieFor({ numPerPage: '50' }))).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
  });

  test('rejects a malformed cookie', () => {
    expect(readNumPerPagePref(`scix_prefs=${encodeURIComponent('{bad')}`)).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
  });

  test('round-trips every supported page size', () => {
    APP_DEFAULTS.PER_PAGE_OPTIONS.forEach((size) => {
      expect(readNumPerPagePref(cookieFor({ numPerPage: size }))).toBe(size);
    });
  });
});

describe('hashSiteMsg', () => {
  test('is stable for the same input', () => {
    expect(hashSiteMsg('Scheduled downtime on Nov 1')).toBe(hashSiteMsg('Scheduled downtime on Nov 1'));
  });

  test('distinguishes different messages', () => {
    expect(hashSiteMsg('first message')).not.toBe(hashSiteMsg('second message'));
  });

  // The hash rides in a cookie sent on every request, so it must not grow with
  // the message, which is arbitrary-length HTML.
  test('stays short regardless of message length', () => {
    expect(hashSiteMsg('x'.repeat(20_000)).length).toBeLessThanOrEqual(16);
  });

  test('treats an empty message as having no hash', () => {
    expect(hashSiteMsg('')).toBe('');
  });
});

describe('readDismissedMsgHash', () => {
  test('returns undefined when scix_prefs is absent', () => {
    expect(readDismissedMsgHash('')).toBeUndefined();
  });

  test('returns undefined when the cookie records no dismissal', () => {
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify({ numPerPage: 25 }))}`;
    expect(readDismissedMsgHash(cookie)).toBeUndefined();
  });

  test('reads the hash from a cookie header string', () => {
    const cookie = `scix_prefs=${encodeURIComponent(JSON.stringify({ dismissedMsg: 'abc123' }))}`;
    expect(readDismissedMsgHash(cookie)).toBe('abc123');
  });

  test('returns undefined on malformed JSON', () => {
    expect(readDismissedMsgHash('scix_prefs=not-json')).toBeUndefined();
  });
});
