import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { renderHook } from '@/test-utils';
import { useSearchResults } from './useSearchResults';
import { APP_DEFAULTS } from '@/config';
import { SolrSort } from '@/api/models';

const defaultParams = {
  q: 'star formation',
  sort: APP_DEFAULTS.SORT as SolrSort[],
  p: 1,
  rows: 10,
  fq: [] as string[],
  d: '',
  showHighlights: false,
};

describe('useSearchResults', () => {
  it('returns isLoading true while fetching', () => {
    const { result } = renderHook(() => useSearchResults(defaultParams));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty docs and zero numFound on empty query without loading', () => {
    const { result } = renderHook(() => useSearchResults({ ...defaultParams, q: '' }));
    expect(result.current.docs).toEqual([]);
    expect(result.current.numFound).toBe(0);
    // query is disabled when q is empty, so isLoading is false immediately
    expect(result.current.isLoading).toBe(false);
  });

  it('detects a slow search after 5 seconds', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useSearchResults(defaultParams));
    expect(result.current.isSlowSearch).toBe(false);
    await act(() => {
      vi.advanceTimersByTime(5001);
    });
    expect(result.current.isSlowSearch).toBe(true);
    vi.useRealTimers();
  });
});
