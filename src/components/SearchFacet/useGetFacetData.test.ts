import { describe, test, expect, vi, TestContext } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement, ReactNode } from 'react';
import { act, createServerListenerMocks, DefaultProviders, urls } from '@/test-utils';
import { IUseGetFacetDataProps } from './useGetFacetData';
import { useGetFacetData } from './useGetFacetData';
import { SearchQueryProvider } from '@/lib/SearchQueryContext';
import { APP_DEFAULTS } from '@/config';
import { FacetField, IADSApiSearchParams } from '@/api/search/types';
import { SearchStatus } from '@/types';

vi.mock('@/components/SearchFacet/store/FacetStore', () => ({
  useFacetStore: () => vi.fn(),
}));

const defaultProps: IUseGetFacetDataProps = {
  field: 'author_facet_hier' as FacetField,
  prefix: '0/',
  level: 'root' as const,
};

const facetParams: IADSApiSearchParams = { q: 'star', sort: APP_DEFAULTS.SORT };

// SCIX-871 gating now flows through SearchQueryContext (was the store's
// searchStatus + latestQuery). The wrapper reads status from a closure so
// transitions are driven by mutating it and calling rerender().
const renderFacetHook = (initialStatus: SearchStatus) => {
  const statusRef = { current: initialStatus };
  const wrapper = ({ children }: { children?: ReactNode }) =>
    createElement(
      SearchQueryProvider,
      { value: { facetParams, searchStatus: statusRef.current } },
      createElement(DefaultProviders, { options: {} }, children),
    );
  const rendered = renderHook(() => useGetFacetData(defaultProps), { wrapper });
  const setStatus = (status: SearchStatus) => {
    statusRef.current = status;
    act(() => rendered.rerender());
  };
  return { ...rendered, setStatus };
};

describe('useGetFacetData — searchStatus gating', () => {
  for (const status of ['idle', 'loading', 'empty', 'error'] as SearchStatus[]) {
    test(`does not fire a request when searchStatus is ${status}`, async ({ server }: TestContext) => {
      const { onRequest } = createServerListenerMocks(server);
      renderFacetHook(status);

      await new Promise((r) => setTimeout(r, 200));
      const facetRequests = urls(onRequest).filter((u) => u === '/search/query');
      expect(facetRequests).toHaveLength(0);
    });
  }

  test('fires and returns data when searchStatus is success', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    const { result } = renderFacetHook('success');

    await waitFor(() => {
      const facetRequests = urls(onRequest).filter((u) => u === '/search/query');
      expect(facetRequests.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(result.current.treeData.length).toBeGreaterThan(0);
    });
  });

  test('regression: loading→success transition unblocks fetch and populates data', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    const { result, setStatus } = renderFacetHook('loading');

    await new Promise((r) => setTimeout(r, 200));
    expect(urls(onRequest).filter((u) => u === '/search/query')).toHaveLength(0);
    expect(result.current.treeData).toHaveLength(0);

    setStatus('success');

    await waitFor(() => {
      expect(urls(onRequest).filter((u) => u === '/search/query').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(result.current.treeData.length).toBeGreaterThan(0);
    });
  });

  test('success→loading transition clears treeData synchronously', async ({ server }: TestContext) => {
    createServerListenerMocks(server);

    const { result, setStatus } = renderFacetHook('success');

    await waitFor(() => {
      expect(result.current.treeData.length).toBeGreaterThan(0);
    });

    setStatus('loading');

    expect(result.current.treeData).toHaveLength(0);
    expect(result.current.totalResults).toBe(0);
  });
});
