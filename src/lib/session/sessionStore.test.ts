import { afterEach, describe, expect, test, vi } from 'vitest';
import { getSessionItem, removeSessionItem, SessionStorageKey, setSessionItem } from './sessionStore';

const KEY = SessionStorageKey.SearchReturnUrl;

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('sessionStore', () => {
  test('round-trips a string value', () => {
    setSessionItem(KEY, '/search?q=star');
    expect(getSessionItem<string>(KEY)).toBe('/search?q=star');
  });

  test('round-trips a structured value', () => {
    const value = { path: '/search', page: 2 };
    setSessionItem(KEY, value);
    expect(getSessionItem<typeof value>(KEY)).toEqual(value);
  });

  test('returns null when no value is stored', () => {
    expect(getSessionItem<string>(KEY)).toBeNull();
  });

  test('removeSessionItem clears the stored value', () => {
    setSessionItem(KEY, '/search?q=star');
    removeSessionItem(KEY);
    expect(getSessionItem<string>(KEY)).toBeNull();
  });

  test('returns null and does not throw when reading fails', () => {
    vi.spyOn(window.sessionStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => getSessionItem<string>(KEY)).not.toThrow();
    expect(getSessionItem<string>(KEY)).toBeNull();
  });

  test('returns null and does not throw when stored value is not valid JSON', () => {
    window.sessionStorage.setItem(KEY, 'not-json{');
    expect(() => getSessionItem<string>(KEY)).not.toThrow();
    expect(getSessionItem<string>(KEY)).toBeNull();
  });

  test('swallows write failures without throwing', () => {
    vi.spyOn(window.sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => setSessionItem(KEY, '/search?q=star')).not.toThrow();
  });
});
