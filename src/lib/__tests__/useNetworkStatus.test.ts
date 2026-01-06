import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../useNetworkStatus';

describe('useNetworkStatus', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  it('returns online status from navigator', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it('sets up event listeners on mount', () => {
    renderHook(() => useNetworkStatus());

    expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('updates isOnline when online event fires', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('updates isOnline when offline event fires', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('sets wasOffline flag when reconnecting', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.wasOffline).toBe(true);
  });

  it('updates lastOnlineAt when coming back online', () => {
    Object.defineProperty(global, 'navigator', {
      value: { onLine: false },
      writable: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.lastOnlineAt).toBeNull();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.lastOnlineAt).toBeInstanceOf(Date);
  });
});
