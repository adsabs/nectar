import { beforeEach, describe, expect, test } from 'vitest';
import { readPrefsCookie, writePrefsCookie } from '../prefs-cookie';

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

  test('does not throw when called with an empty updates object', () => {
    expect(() => writePrefsCookie({})).not.toThrow();
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
