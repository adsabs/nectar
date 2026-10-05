import { describe, expect, test } from 'vitest';
import { resolveAppState } from './resolveAppState';
import { AppMode } from '@/types';
import { SearchMode } from '@/utils/common/search-mode-constants';

const prefs = (value: Record<string, unknown>) => `scix_prefs=${encodeURIComponent(JSON.stringify(value))}`;

describe('resolveAppState — mode precedence', () => {
  test('forceMode beats the URL discipline param', () => {
    const state = resolveAppState({
      pathname: '/search',
      forceModeParam: 'astrophysics',
      dParam: 'heliophysics',
      cookieHeader: prefs({ mode: AppMode.PLANET_SCIENCE }),
    });

    expect(state.mode).toBe(AppMode.ASTROPHYSICS);
  });

  test('the URL discipline param beats the cookie', () => {
    const state = resolveAppState({
      pathname: '/search',
      dParam: 'heliophysics',
      cookieHeader: prefs({ mode: AppMode.ASTROPHYSICS }),
    });

    expect(state.mode).toBe(AppMode.HELIOPHYSICS);
  });

  test('falls back to the cookie when the URL says nothing', () => {
    const state = resolveAppState({ pathname: '/search', cookieHeader: prefs({ mode: AppMode.ASTROPHYSICS }) });

    expect(state.mode).toBe(AppMode.ASTROPHYSICS);
  });

  // Omitting mode lets the client land on its own zustand initial value, which
  // is what keeps the server and client query identities in agreement.
  test('omits mode entirely when nothing resolves it', () => {
    const state = resolveAppState({ pathname: '/search', cookieHeader: '' });

    expect(state.mode).toBeUndefined();
  });

  test('ignores an unrecognised cookie mode', () => {
    const state = resolveAppState({ pathname: '/search', cookieHeader: prefs({ mode: 'NOT_A_MODE' }) });

    expect(state.mode).toBeUndefined();
  });

  test('ignores an unrecognised discipline param', () => {
    const state = resolveAppState({ pathname: '/search', dParam: 'phrenology' });

    expect(state.mode).toBeUndefined();
  });
});

describe('resolveAppState — discipline param is search-page only', () => {
  test('honours the d param on /search', () => {
    expect(resolveAppState({ pathname: '/search', dParam: 'heliophysics' }).mode).toBe(AppMode.HELIOPHYSICS);
  });

  test.each(['/abs/2020ApJ...1S', '/', '/user/libraries'])('ignores the d param on %s', (pathname) => {
    expect(resolveAppState({ pathname, dParam: 'heliophysics' }).mode).toBeUndefined();
  });

  // forceMode is how a non-search route pushes a discipline, so it must not be
  // gated on the pathname the way d is.
  test('still honours forceMode off the search page', () => {
    expect(resolveAppState({ pathname: '/classic-form', forceModeParam: 'astrophysics' }).mode).toBe(
      AppMode.ASTROPHYSICS,
    );
  });
});

describe('resolveAppState — searchMode is astrophysics-only', () => {
  test('keeps a cookie searchMode when the resolved mode is astrophysics', () => {
    const state = resolveAppState({
      pathname: '/search',
      cookieHeader: prefs({ mode: AppMode.ASTROPHYSICS, searchMode: SearchMode.ADS_COMPAT }),
    });

    expect(state.searchMode).toBe(SearchMode.ADS_COMPAT);
  });

  test('drops the cookie searchMode under any other mode', () => {
    const state = resolveAppState({
      pathname: '/search',
      cookieHeader: prefs({ mode: AppMode.HELIOPHYSICS, searchMode: SearchMode.ADS_COMPAT }),
    });

    expect(state.searchMode).toBeUndefined();
  });

  test('ignores an unrecognised cookie searchMode', () => {
    const state = resolveAppState({
      pathname: '/search',
      cookieHeader: prefs({ mode: AppMode.ASTROPHYSICS, searchMode: 'sideways' }),
    });

    expect(state.searchMode).toBeUndefined();
  });
});

describe('resolveAppState — user and notification', () => {
  test('passes through valid user data', () => {
    const userData = {
      access_token: 'tok',
      username: 'someone@ads',
      anonymous: false,
      expires_at: '9999999999',
    };

    expect(resolveAppState({ pathname: '/search', userData }).user).toEqual(userData);
  });

  test('yields an empty user for malformed user data', () => {
    expect(resolveAppState({ pathname: '/search', userData: { nope: true } as never }).user).toEqual({});
  });

  test('resolves a known notify param', () => {
    expect(resolveAppState({ pathname: '/search', notifyParam: 'account-logout-success' }).notification).not.toBeNull();
  });

  test('yields no notification for an unknown notify param', () => {
    expect(resolveAppState({ pathname: '/search', notifyParam: 'not-a-notification' }).notification).toBeNull();
  });

  test('tolerates a malformed cookie', () => {
    expect(() => resolveAppState({ pathname: '/search', cookieHeader: 'scix_prefs=%7Bbroken' })).not.toThrow();
  });
});
