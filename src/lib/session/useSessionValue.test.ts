import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { SessionStorageKey, setSessionItem } from './sessionStore';
import { useSessionValue } from './useSessionValue';

const KEY = SessionStorageKey.SearchReturnUrl;

afterEach(() => {
  window.sessionStorage.clear();
});

describe('useSessionValue', () => {
  test('reports not-ready with a null value on the first render', () => {
    setSessionItem(KEY, '/search?q=star');
    const renders: Array<{ value: string | null; isReady: boolean }> = [];
    renderHook(() => {
      const state = useSessionValue<string>(KEY);
      renders.push(state);
      return state;
    });
    // First render happens before the effect runs: not ready, value still null.
    expect(renders[0]).toEqual({ value: null, isReady: false });
  });

  test('reads the stored value and becomes ready after mount', async () => {
    setSessionItem(KEY, '/search?q=star');
    const { result } = renderHook(() => useSessionValue<string>(KEY));
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
      expect(result.current.value).toBe('/search?q=star');
    });
  });

  test('becomes ready with a null value when nothing is stored', async () => {
    const { result } = renderHook(() => useSessionValue<string>(KEY));
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.value).toBeNull();
  });
});
