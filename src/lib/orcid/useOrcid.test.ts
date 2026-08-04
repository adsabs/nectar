import { act } from '@testing-library/react';
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
