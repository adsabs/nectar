import { describe, it, expect, vi } from 'vitest';
// useSearchPage needs a custom nuqs wrapper, so import renderHook directly from RTL
// (not from @/test-utils whose renderHook doesn't accept a { wrapper } option with custom components)
import { renderHook, act } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { DefaultProviders } from '@/test-utils';
import { useSearchPage } from './useSearchPage';
import React from 'react';

// useSearchPage reads router.query.rows to determine if the URL has an explicit
// rows param (vs falling back to the persisted Zustand preference).
// The nuqs testing adapter does not mount Next.js router, so we mock it here.
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({ query: {} })),
}));

// DefaultProviders requires options prop — all fields are optional so {} is fine.
// Cast to a looser FC type so React.createElement accepts children as the 3rd arg
// without TypeScript requiring them in the props object.
type TestableProviders = React.FC<{ options: Record<string, unknown>; children?: React.ReactNode }>;
const TestProviders = DefaultProviders as unknown as TestableProviders;

// Compose nuqs adapter with DefaultProviders (React Query + store + Chakra).
const makeWrapper = (searchParams: string) => {
  const NuqsWrapper = withNuqsTestingAdapter({ searchParams });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(NuqsWrapper, null, React.createElement(TestProviders, { options: {} }, children));
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('useSearchPage', () => {
  it('onSubmit updates q and resets page to 1', async () => {
    const { result } = renderHook(() => useSearchPage(), {
      wrapper: makeWrapper('?q=stars&p=3'),
    });
    await act(async () => {
      await result.current.handlers.onSubmit('galaxies');
    });
    expect(result.current.params.q).toBe('galaxies');
    expect(result.current.params.p).toBe(1);
  });

  it('onSort updates sort and resets page to 1', async () => {
    const { result } = renderHook(() => useSearchPage(), {
      wrapper: makeWrapper('?q=stars&p=2'),
    });
    await act(async () => {
      await result.current.handlers.onSort(['date desc', 'score desc']);
    });
    expect(result.current.params.sort).toEqual(['date desc', 'score desc']);
    expect(result.current.params.p).toBe(1);
  });

  it('onPageChange updates page without resetting other params', async () => {
    const { result } = renderHook(() => useSearchPage(), {
      wrapper: makeWrapper('?q=stars&sort=date+desc&p=1'),
    });
    await act(async () => {
      await result.current.handlers.onPageChange(4);
    });
    expect(result.current.params.p).toBe(4);
    expect(result.current.params.q).toBe('stars');
  });

  it('onPerPageChange updates rows and resets page to 1', async () => {
    const { result } = renderHook(() => useSearchPage(), {
      wrapper: makeWrapper('?q=stars&p=5&rows=10'),
    });
    await act(async () => {
      await result.current.handlers.onPerPageChange(25);
    });
    expect(result.current.params.rows).toBe(25);
    expect(result.current.params.p).toBe(1);
  });

  it('onFacetChange updates fq and resets page to 1', async () => {
    const { result } = renderHook(() => useSearchPage(), {
      wrapper: makeWrapper('?q=stars&p=2'),
    });
    await act(async () => {
      await result.current.handlers.onFacetChange(['author:Smith', 'year:2020']);
    });
    expect(result.current.params.fq).toEqual(['author:Smith', 'year:2020']);
    expect(result.current.params.p).toBe(1);
  });

  it('onToggleHighlights flips the showHighlights param', async () => {
    const { result } = renderHook(() => useSearchPage(), {
      wrapper: makeWrapper('?q=stars'),
    });
    expect(result.current.params.showHighlights).toBe(false);
    await act(async () => {
      await result.current.handlers.onToggleHighlights();
    });
    expect(result.current.params.showHighlights).toBe(true);
  });
});
