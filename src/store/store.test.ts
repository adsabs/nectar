import { describe, expect, test } from 'vitest';
import { createStore, mergePersistedState } from '@/store/store';
import { AppState } from '@/store';
import { ORCID_MODE_TIMEOUT } from '@/config';
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
