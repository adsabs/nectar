import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createStore } from '@/store/store';
import { isOrcidActivityStale } from '@/store/slices/orcid';
import { ORCID_MODE_TIMEOUT } from '@/config';
import mockOrcidUser from '@/mocks/responses/orcid/exchangeOAuthCode.json';

describe('isOrcidActivityStale', () => {
  test('is not stale when lastActivityAt is null', () => {
    expect(isOrcidActivityStale(null)).toBe(false);
  });

  test('is not stale when within the timeout window', () => {
    expect(isOrcidActivityStale(Date.now() - (ORCID_MODE_TIMEOUT - 1000))).toBe(false);
  });

  test('is stale once past the timeout window', () => {
    expect(isOrcidActivityStale(Date.now() - (ORCID_MODE_TIMEOUT + 1000))).toBe(true);
  });
});

describe('orcid slice', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setOrcidMode', () => {
    test('stamps lastActivityAt when turning mode on', () => {
      const now = Date.now();
      store.getState().setOrcidMode(true);
      expect(store.getState().orcid.active).toBe(true);
      expect(store.getState().orcid.lastActivityAt).toBe(now);
    });

    test('clears lastActivityAt when turning mode off (manual toggle unaffected by expiry state)', () => {
      store.getState().setOrcidMode(true);
      store.getState().setOrcidMode(false);
      expect(store.getState().orcid.active).toBe(false);
      expect(store.getState().orcid.lastActivityAt).toBeNull();
    });
  });

  describe('touchOrcidActivity', () => {
    test('resets lastActivityAt while mode is active (sliding window)', () => {
      store.getState().setOrcidMode(true);
      const firstTimestamp = store.getState().orcid.lastActivityAt;

      vi.advanceTimersByTime(60_000);
      store.getState().touchOrcidActivity();

      expect(store.getState().orcid.lastActivityAt).toBeGreaterThan(firstTimestamp);
    });

    test('is a no-op when mode is off', () => {
      store.getState().touchOrcidActivity();
      expect(store.getState().orcid.lastActivityAt).toBeNull();
    });
  });

  describe('setOrcidUser', () => {
    test('activates mode and stamps lastActivityAt for a valid user', () => {
      const now = Date.now();
      store.getState().setOrcidUser(mockOrcidUser);
      expect(store.getState().orcid.active).toBe(true);
      expect(store.getState().orcid.lastActivityAt).toBe(now);
    });

    test('deactivates mode and clears lastActivityAt for an invalid user', () => {
      store.getState().setOrcidUser(mockOrcidUser);
      // @ts-expect-error - testing with invalid user
      store.getState().setOrcidUser({});
      expect(store.getState().orcid.active).toBe(false);
      expect(store.getState().orcid.lastActivityAt).toBeNull();
    });
  });

  describe('resetOrcid', () => {
    test('clears lastActivityAt along with the rest of orcid state', () => {
      store.getState().setOrcidUser(mockOrcidUser);
      store.getState().resetOrcid();
      expect(store.getState().orcid).toEqual({
        isAuthenticated: false,
        user: null,
        active: false,
        lastActivityAt: null,
      });
    });
  });
});
