import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { APP_STORAGE_KEY, createStore, mergePersistedState, seedNumPerPagePref } from '@/store/store';
import { AppState } from '@/store';
import { APP_DEFAULTS, ORCID_MODE_TIMEOUT } from '@/config';
import { writePrefsCookie } from '@/utils/common/prefs-cookie';
import mockOrcidUser from '@/mocks/responses/orcid/exchangeOAuthCode.json';

describe('mergePersistedState', () => {
  test('silently clears stale orcid mode from persisted state', () => {
    const currentState = createStore().getState();
    const persistedState = {
      orcid: {
        isAuthenticated: true,
        user: mockOrcidUser,
        active: true,
        lastActivityAt: Date.now() - (ORCID_MODE_TIMEOUT + 1000),
      },
    };

    const merged = mergePersistedState(persistedState, currentState);

    expect(merged.orcid.active).toBe(false);
    expect(merged.orcid.lastActivityAt).toBeNull();
    // rest of orcid state (auth/user) is untouched by expiry cleanup
    expect(merged.orcid.isAuthenticated).toBe(true);
    expect(merged.orcid.user).toEqual(mockOrcidUser);
  });

  test('leaves fresh orcid mode from persisted state alone', () => {
    const currentState = createStore().getState();
    const persistedState = {
      orcid: {
        isAuthenticated: true,
        user: mockOrcidUser,
        active: true,
        lastActivityAt: Date.now() - 1000,
      },
    };

    const merged = mergePersistedState(persistedState, currentState);

    expect(merged.orcid.active).toBe(true);
    expect(merged.orcid.lastActivityAt).toBe(persistedState.orcid.lastActivityAt);
  });

  test('leaves inactive persisted orcid mode alone', () => {
    const currentState = createStore().getState();
    const persistedState: Partial<AppState> = {
      orcid: {
        isAuthenticated: false,
        user: null,
        active: false,
        lastActivityAt: null,
      },
    };

    const merged = mergePersistedState(persistedState, currentState);

    expect(merged.orcid.active).toBe(false);
    expect(merged.orcid.lastActivityAt).toBeNull();
  });

  test('clears active mode persisted before lastActivityAt existed (missing key)', () => {
    const currentState = createStore().getState();
    // legacy shape: no lastActivityAt key at all, as would come from JSON
    // parsed out of localStorage predating this field
    const persistedState = {
      orcid: { isAuthenticated: true, user: mockOrcidUser, active: true },
    } as unknown as Partial<AppState>;

    const merged = mergePersistedState(persistedState, currentState);

    expect(merged.orcid.active).toBe(false);
    expect(merged.orcid.lastActivityAt).toBeNull();
  });

  test('clears active mode with an explicit null lastActivityAt', () => {
    const currentState = createStore().getState();
    const persistedState: Partial<AppState> = {
      orcid: { isAuthenticated: true, user: mockOrcidUser, active: true, lastActivityAt: null },
    };

    const merged = mergePersistedState(persistedState, currentState);

    expect(merged.orcid.active).toBe(false);
    expect(merged.orcid.lastActivityAt).toBeNull();
  });
});

// numPerPage lives only in localStorage, which the server can't read, and
// rehydration never goes through setNumPerPage — without this seeding, a
// non-default page size never reaches the prefs cookie the server reads.
describe('seedNumPerPagePref', () => {
  const readPrefs = (): Record<string, unknown> => {
    const match = document.cookie.match(/scix_prefs=([^;]+)/);
    return match ? (JSON.parse(decodeURIComponent(match[1])) as Record<string, unknown>) : {};
  };

  beforeEach(() => {
    document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
  });

  test('writes a rehydrated non-default numPerPage to the prefs cookie', () => {
    seedNumPerPagePref({ numPerPage: 50 } as AppState);

    expect(readPrefs().numPerPage).toBe(50);
  });

  test('does nothing when there is no rehydrated state', () => {
    seedNumPerPagePref(undefined);

    expect(readPrefs()).not.toHaveProperty('numPerPage');
  });

  test('ignores a persisted value outside PER_PAGE_OPTIONS', () => {
    seedNumPerPagePref({ numPerPage: 7 } as unknown as AppState);

    expect(readPrefs()).not.toHaveProperty('numPerPage');
  });

  test('ignores a non-numeric persisted value', () => {
    seedNumPerPagePref({ numPerPage: '50' } as unknown as AppState);

    expect(readPrefs()).not.toHaveProperty('numPerPage');
  });

  test('preserves other prefs already in the cookie', () => {
    writePrefsCookie({ mode: 'ASTROPHYSICS' });

    seedNumPerPagePref({ numPerPage: 25 } as AppState);

    expect(readPrefs().mode).toBe('ASTROPHYSICS');
    expect(readPrefs().numPerPage).toBe(25);
  });

  test('seeds the default page size so the server and client agree explicitly', () => {
    seedNumPerPagePref({ numPerPage: APP_DEFAULTS.RESULT_PER_PAGE } as AppState);

    expect(readPrefs().numPerPage).toBe(APP_DEFAULTS.RESULT_PER_PAGE);
  });
});

// The tests above would still pass with the onRehydrateStorage wiring
// deleted, since createStore skips persist entirely under NODE_ENV=test —
// this exercises the real pipeline instead.
describe('numPerPage cookie seeding through real persist rehydration', () => {
  const readPrefs = (): Record<string, unknown> => {
    const match = document.cookie.match(/scix_prefs=([^;]+)/);
    return match ? (JSON.parse(decodeURIComponent(match[1])) as Record<string, unknown>) : {};
  };

  beforeEach(() => {
    document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.clear();
  });

  test('seeds the cookie from a persisted non-default numPerPage', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ state: { numPerPage: 50 }, version: 0 }));

    createStore();

    await vi.waitFor(() => expect(readPrefs().numPerPage).toBe(50));
  });

  test('leaves the cookie alone when the persisted value is invalid', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ state: { numPerPage: 7 }, version: 0 }));

    createStore();

    await vi.waitFor(() => expect(window.localStorage.getItem(APP_STORAGE_KEY)).not.toBeNull());
    expect(readPrefs()).not.toHaveProperty('numPerPage');
  });
});
