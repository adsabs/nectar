import { act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@/test-utils';
import { AppState, useStore } from '@/store';
import { useOrcid, useOrcidExpiryWatcher } from './useOrcid';
import { ORCID_MODE_TIMEOUT } from '@/config';

const mocks = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { isActive: vi.fn(() => false) }),
  useRouter: vi.fn(() => ({
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mocks.toast,
  };
});

type MockQueryResult = {
  data: unknown;
  error: unknown;
  isFetchedAfterMount: boolean;
  isLoading: boolean;
};

const IDLE_RESULT: MockQueryResult = {
  data: null,
  error: null,
  isFetchedAfterMount: false,
  isLoading: false,
};

const profileResult = { current: IDLE_RESULT };
const nameCalls: Array<{ enabled: boolean }> = [];
const profileCalls: Array<{ enabled: boolean }> = [];

vi.mock('@/api/orcid/orcid', async () => {
  const actual = await vi.importActual<typeof import('@/api/orcid/orcid')>('@/api/orcid/orcid');
  return {
    ...actual,
    useOrcidGetName: (_params: unknown, options: { enabled: boolean }) => {
      nameCalls.push(options);
      return IDLE_RESULT;
    },
    useOrcidGetProfile: (_params: unknown, options: { enabled: boolean }) => {
      profileCalls.push(options);
      return profileResult.current;
    },
  };
});

const touchOrcidActivitySelector = (state: AppState) => state.touchOrcidActivity;

const renderExpiryWatcher = (lastActivityAt: number | null, active = true) =>
  renderHook(
    () => {
      useOrcidExpiryWatcher();
      const orcid = useOrcid();
      const touchOrcidActivity = useStore(touchOrcidActivitySelector);
      return { ...orcid, touchOrcidActivity };
    },
    { initialStore: { orcid: { active, isAuthenticated: false, user: null, lastActivityAt } } },
  );

describe('useOrcidExpiryWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.toast.mockClear();
    mocks.toast.isActive.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('does not fire before the timeout elapses', () => {
    const { result } = renderExpiryWatcher(Date.now());

    act(() => {
      vi.advanceTimersByTime(ORCID_MODE_TIMEOUT - 1000);
    });

    expect(result.current.active).toBe(true);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('turns off orcid mode and shows a toast once the timeout elapses', () => {
    const { result } = renderExpiryWatcher(Date.now());

    act(() => {
      vi.advanceTimersByTime(ORCID_MODE_TIMEOUT);
    });

    expect(result.current.active).toBe(false);
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'ORCiD mode turned off due to inactivity' }),
    );
  });

  test('sliding window: activity resets the timer', () => {
    const { result } = renderExpiryWatcher(Date.now());

    act(() => {
      vi.advanceTimersByTime(ORCID_MODE_TIMEOUT - 1000);
    });
    expect(result.current.active).toBe(true);

    act(() => {
      result.current.touchOrcidActivity();
    });

    // total elapsed time now exceeds the original timeout, but the reset
    // means the window only started counting again from the touch
    act(() => {
      vi.advanceTimersByTime(ORCID_MODE_TIMEOUT - 1000);
    });
    expect(result.current.active).toBe(true);
    expect(mocks.toast).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.active).toBe(false);
    expect(mocks.toast).toHaveBeenCalledTimes(1);
  });

  test('manual toggle-off is unaffected: no expiry toast fires', () => {
    const { result } = renderExpiryWatcher(Date.now());

    act(() => {
      result.current.toggleOrcidMode(false);
    });
    expect(result.current.active).toBe(false);

    act(() => {
      vi.advanceTimersByTime(ORCID_MODE_TIMEOUT);
    });

    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('does nothing when mode is already off', () => {
    const { result } = renderExpiryWatcher(null, false);

    act(() => {
      vi.advanceTimersByTime(ORCID_MODE_TIMEOUT);
    });

    expect(result.current.active).toBe(false);
    expect(mocks.toast).not.toHaveBeenCalled();
  });
});

const VALID_ORCID_USER = {
  access_token: 'token',
  expires_in: 3600,
  name: 'Smith, J',
  orcid: '0000-0001-2345-6789',
  refresh_token: 'refresh',
  scope: '/read-limited',
  token_type: 'bearer',
};

const serverError = { isAxiosError: true, response: { status: 500 } };

const renderOrcid = (active = true) =>
  renderHook(() => useOrcid(), {
    initialStore: {
      orcid: { active, isAuthenticated: true, user: VALID_ORCID_USER, lastActivityAt: Date.now() },
    },
  });

describe('useOrcid — profile error toasts', () => {
  beforeEach(() => {
    mocks.toast.mockClear();
    mocks.toast.isActive.mockClear();
    nameCalls.length = 0;
    profileCalls.length = 0;
    profileResult.current = IDLE_RESULT;
  });

  test('does not toast a cached profile error that predates this mount', () => {
    profileResult.current = {
      data: null,
      error: serverError,
      isFetchedAfterMount: false,
      isLoading: false,
    };

    renderOrcid();

    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('toasts a profile error that happens while mounted', () => {
    const { rerender } = renderOrcid();

    profileResult.current = {
      data: null,
      error: serverError,
      isFetchedAfterMount: true,
      isLoading: false,
    };
    rerender();

    expect(mocks.toast).toHaveBeenCalledTimes(1);
  });

  test('does not evict the shared profile query when mode is turned off', () => {
    const removeQueries = vi.spyOn(QueryClient.prototype, 'removeQueries');
    profileResult.current = {
      data: null,
      error: serverError,
      isFetchedAfterMount: true,
      isLoading: false,
    };

    renderOrcid(false);

    expect(removeQueries).not.toHaveBeenCalled();
    removeQueries.mockRestore();
  });

  test('does not query the ORCiD profile while ORCiD mode is off', () => {
    renderOrcid(false);

    expect(profileCalls.every((call) => call.enabled === false)).toBe(true);
    expect(nameCalls.every((call) => call.enabled === false)).toBe(true);
  });
});
