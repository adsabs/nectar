import { act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@/test-utils';
import { AppState, useStore } from '@/store';
import { useOrcid, useOrcidExpiryWatcher } from './useOrcid';
import { ORCID_MODE_TIMEOUT } from '@/config';

const mocks = vi.hoisted(() => {
  const defaultRouter = {
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    onNavigateStart: (): (() => void) => () => undefined,
    onNavigateComplete: (): (() => void) => () => undefined,
    events: { on: vi.fn(), off: vi.fn() },
  };
  const routerRef = { current: defaultRouter as unknown };

  return {
    toast: Object.assign(vi.fn(), { isActive: vi.fn(() => false) }),
    defaultRouter,
    routerRef,
    useRouter: vi.fn(() => routerRef.current),
  };
});

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useRouterCompat', () => ({ useRouterCompat: mocks.useRouter }));

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

  // useWork shares the profile key and stays enabled while mode is off, so its
  // fetches flip isFetchedAfterMount on this hook's disabled observer too.
  test('does not toast a fresh profile error while ORCiD mode is off', () => {
    profileResult.current = {
      data: null,
      error: serverError,
      isFetchedAfterMount: true,
      isLoading: false,
    };

    renderOrcid(false);

    expect(mocks.toast).not.toHaveBeenCalled();
  });

  // Guards against re-introducing the eviction approach, which looped: the key
  // is shared, so removing it made the still-enabled observers refetch.
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

const createMockRouter = (pathname: string) => {
  const navigateListeners = new Set<() => void>();
  const completeListeners = new Set<() => void>();
  const errorListeners = new Set<() => void>();

  const router = {
    pathname,
    query: {},
    asPath: pathname,
    push: vi.fn(),
    replace: vi.fn(),
    onNavigateStart: (cb: () => void) => {
      navigateListeners.add(cb);
      return () => navigateListeners.delete(cb);
    },
    onNavigateComplete: (cb: () => void) => {
      completeListeners.add(cb);
      return () => completeListeners.delete(cb);
    },
    onNavigateError: (cb: () => void) => {
      errorListeners.add(cb);
      return () => errorListeners.delete(cb);
    },
    events: { on: vi.fn(), off: vi.fn() },
  };

  const emit = (listeners: Set<() => void>) => act(() => listeners.forEach((listener) => listener()));

  return {
    router,
    completeListeners,
    errorListeners,
    emitNavigateStart: () => emit(navigateListeners),
    emitNavigateComplete: () => emit(completeListeners),
    emitNavigateError: () => emit(errorListeners),
  };
};

describe('useOrcid — logout', () => {
  afterEach(() => {
    mocks.routerRef.current = mocks.defaultRouter;
  });

  test.each(['/user/orcid', '/user/orcid/OAuth'])('navigates home before resetting on %s', (pathname) => {
    const { router, emitNavigateComplete } = createMockRouter(pathname);
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());

    expect(router.replace).toHaveBeenCalledWith('/');
    expect(result.current.isAuthenticated).toBe(true);

    emitNavigateComplete();

    expect(result.current.isAuthenticated).toBe(false);
  });

  // The reset unmounts the ORCiD page's data, so it must not run while that
  // page is still on screen. Pages Router fires navigation-start before the
  // URL swap, which is too early.
  test('does not reset when navigation only starts', () => {
    const { router, emitNavigateStart } = createMockRouter('/user/orcid');
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());
    emitNavigateStart();

    expect(result.current.isAuthenticated).toBe(true);
  });

  test('unsubscribes once the reset has run', () => {
    const { router, completeListeners, emitNavigateComplete } = createMockRouter('/user/orcid');
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());
    expect(completeListeners.size).toBe(1);

    emitNavigateComplete();

    expect(completeListeners.size).toBe(0);
  });

  test('resets immediately when not on an ORCiD page', () => {
    const { router } = createMockRouter('/search');
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());

    expect(router.replace).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // The reset used to hang off `replace().finally()`, which ran whether the
  // navigation succeeded or failed. Subscribing only to completion leaves a
  // logged-out user still showing as ORCiD-active when the navigation aborts.
  test('still resets when the navigation home fails', () => {
    const { router, emitNavigateError } = createMockRouter('/user/orcid');
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());
    emitNavigateError();

    expect(result.current.isAuthenticated).toBe(false);
  });

  test('unsubscribes from both outcomes after a failed navigation', () => {
    const { router, completeListeners, errorListeners, emitNavigateError } = createMockRouter('/user/orcid');
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());
    expect(completeListeners.size).toBe(1);
    expect(errorListeners.size).toBe(1);

    emitNavigateError();

    expect(completeListeners.size).toBe(0);
    expect(errorListeners.size).toBe(0);
  });

  test('unsubscribes from both outcomes after a successful navigation', () => {
    const { router, completeListeners, errorListeners, emitNavigateComplete } = createMockRouter('/user/orcid');
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());
    emitNavigateComplete();

    expect(completeListeners.size).toBe(0);
    expect(errorListeners.size).toBe(0);
  });

  test('resets only once when both outcomes somehow fire', () => {
    const { router, emitNavigateComplete, emitNavigateError } = createMockRouter('/user/orcid');
    mocks.routerRef.current = router;
    const { result } = renderOrcid();

    act(() => result.current.logout());
    emitNavigateComplete();
    emitNavigateError();

    expect(result.current.isAuthenticated).toBe(false);
  });
});
