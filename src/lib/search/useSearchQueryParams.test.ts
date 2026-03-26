import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useSearchQueryParams } from './useSearchQueryParams';

describe('useSearchQueryParams', () => {
  it('returns default values when URL has no params', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '' }),
    });
    expect(result.current.params.q).toBe('');
    expect(result.current.params.p).toBe(1);
    expect(result.current.params.rows).toBe(10);
    expect(result.current.params.fq).toEqual([]);
    expect(result.current.params.showHighlights).toBe(false);
  });

  it('parses q from URL', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?q=star+formation' }),
    });
    expect(result.current.params.q).toBe('star formation');
  });

  it('parses fq as an array of repeated params', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?fq=author%3ASmith&fq=year%3A2020' }),
    });
    expect(result.current.params.fq).toEqual(['author:Smith', 'year:2020']);
  });

  it('parses page number from URL', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?p=3' }),
    });
    expect(result.current.params.p).toBe(3);
  });

  it('setParams updates the URL', async () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?q=stars' }),
    });
    await act(async () => {
      await result.current.setParams({ q: 'galaxies', p: 2 });
    });
    expect(result.current.params.q).toBe('galaxies');
    expect(result.current.params.p).toBe(2);
  });

  it('computes start correctly from p and rows', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?p=3&rows=25' }),
    });
    expect(result.current.start).toBe(50); // (3-1) * 25
  });
});
