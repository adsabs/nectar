import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useCreateQueryClient } from './useCreateQueryClient';

const MINUTE = 60 * 1000;

describe('useCreateQueryClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('keeps unobserved query data cached long enough for back-navigation', () => {
    const { result } = renderHook(() => useCreateQueryClient());
    const queryClient = result.current;

    queryClient.setQueryData(['search', 'star'], { numFound: 1 });

    // No mounted observer, so GC starts immediately per react-query defaults
    vi.advanceTimersByTime(20 * MINUTE);

    expect(queryClient.getQueryData(['search', 'star'])).toEqual({ numFound: 1 });
  });

  test('eventually evicts unobserved query data within the hour', () => {
    const { result } = renderHook(() => useCreateQueryClient());
    const queryClient = result.current;

    queryClient.setQueryData(['search', 'star'], { numFound: 1 });

    vi.advanceTimersByTime(61 * MINUTE);

    expect(queryClient.getQueryData(['search', 'star'])).toBeUndefined();
  });
});
