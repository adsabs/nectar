import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { APP_DEFAULTS } from '@/config';

import { useSlowSearchNotice } from './useSlowSearchNotice';

const THRESHOLD = 15000;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

describe('useSlowSearchNotice timing', () => {
  test('stays false until the threshold elapses, then is true', () => {
    const { result } = renderHook(() => useSlowSearchNotice({ isPending: true }));

    expect(result.current).toBe(false);

    advance(THRESHOLD - 1);
    expect(result.current).toBe(false);

    advance(1);
    expect(result.current).toBe(true);
  });

  test('remains true while the search keeps pending past the threshold', () => {
    const { result } = renderHook(() => useSlowSearchNotice({ isPending: true }));

    advance(THRESHOLD);
    expect(result.current).toBe(true);

    advance(THRESHOLD * 4);
    expect(result.current).toBe(true);
  });

  test('never fires while the search is not pending', () => {
    const { result } = renderHook(() => useSlowSearchNotice({ isPending: false }));

    advance(THRESHOLD * 4);
    expect(result.current).toBe(false);
  });

  test('honors an explicitly passed thresholdMs', () => {
    const { result } = renderHook(() => useSlowSearchNotice({ isPending: true, thresholdMs: 2000 }));

    advance(1999);
    expect(result.current).toBe(false);

    advance(1);
    expect(result.current).toBe(true);
  });
});

describe('useSlowSearchNotice lifecycle', () => {
  test('clears when the search stops pending', () => {
    const { result, rerender } = renderHook(({ isPending }) => useSlowSearchNotice({ isPending }), {
      initialProps: { isPending: true },
    });

    advance(THRESHOLD);
    expect(result.current).toBe(true);

    rerender({ isPending: false });
    expect(result.current).toBe(false);
  });

  test('re-arms for a later search after clearing', () => {
    const { result, rerender } = renderHook(({ isPending }) => useSlowSearchNotice({ isPending }), {
      initialProps: { isPending: true },
    });

    advance(THRESHOLD);
    rerender({ isPending: false });
    expect(result.current).toBe(false);

    rerender({ isPending: true });
    advance(THRESHOLD - 1);
    expect(result.current).toBe(false);

    advance(1);
    expect(result.current).toBe(true);
  });

  test('restarts the window when a pending search is interrupted', () => {
    const { result, rerender } = renderHook(({ isPending }) => useSlowSearchNotice({ isPending }), {
      initialProps: { isPending: true },
    });

    advance(THRESHOLD - 1000);
    rerender({ isPending: false });
    rerender({ isPending: true });

    advance(1000);
    expect(result.current).toBe(false);

    advance(THRESHOLD - 1000);
    expect(result.current).toBe(true);
  });

  test('discards its pending timer on unmount', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { unmount } = renderHook(() => useSlowSearchNotice({ isPending: true }));

    advance(THRESHOLD - 1000);
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    advance(THRESHOLD * 4);
    expect(consoleError).not.toHaveBeenCalled();
  });
});

describe('slow search threshold config', () => {
  test('defaults to 15000 ms when the env override is unset', () => {
    expect(process.env.NEXT_PUBLIC_SLOW_SEARCH_THRESHOLD_MS).toBeUndefined();
    expect(APP_DEFAULTS.SLOW_SEARCH_THRESHOLD).toBe(15000);
  });

  test('stays below the API timeout it has to fire inside of', () => {
    expect(APP_DEFAULTS.SLOW_SEARCH_THRESHOLD).toBeLessThan(APP_DEFAULTS.API_TIMEOUT);
  });

  test('reads NEXT_PUBLIC_SLOW_SEARCH_THRESHOLD_MS when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SLOW_SEARCH_THRESHOLD_MS', '25000');
    vi.resetModules();

    const { APP_DEFAULTS: reloaded } = await import('@/config');

    expect(reloaded.SLOW_SEARCH_THRESHOLD).toBe(25000);
  });

  test('backs the hook default with the configured threshold', () => {
    const { result } = renderHook(() => useSlowSearchNotice({ isPending: true }));

    advance(APP_DEFAULTS.SLOW_SEARCH_THRESHOLD - 1);
    expect(result.current).toBe(false);

    advance(1);
    expect(result.current).toBe(true);
  });
});
