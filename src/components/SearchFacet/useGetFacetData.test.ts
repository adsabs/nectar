import { describe, test, expect, vi, TestContext } from 'vitest';
import { renderHook, waitFor, act, createServerListenerMocks, urls } from '@/test-utils';
import { useStore } from '@/store';
import { IUseGetFacetDataProps } from './useGetFacetData';
import { useGetFacetData } from './useGetFacetData';
import { defaultQueryParams } from '@/store/slices/search';
import { FacetField } from '@/api/search/types';

vi.mock('@/components/SearchFacet/store/FacetStore', () => ({
  useFacetStore: () => vi.fn(),
}));

const defaultProps = {
  field: 'author_facet_hier' as FacetField,
  prefix: '0/',
  level: 'root' as const,
};

const useCompound = (props: IUseGetFacetDataProps) => ({
  setSearchStatus: useStore((state) => state.setSearchStatus),
  facet: useGetFacetData(props),
});

describe('useGetFacetData', () => {
  test('does not fire a request when searchStatus is idle', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    renderHook(() => useGetFacetData(defaultProps), {
      initialStore: { searchStatus: 'idle', latestQuery: { ...defaultQueryParams, q: 'star' } },
    });

    await new Promise((r) => setTimeout(r, 200));
    const searchRequests = urls(onRequest).filter((u) => u === '/search/query');
    expect(searchRequests).toHaveLength(0);
  });

  test('does not fire a request when searchStatus is not success (empty)', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    renderHook(() => useGetFacetData(defaultProps), {
      initialStore: { searchStatus: 'empty', latestQuery: { ...defaultQueryParams, q: 'star' } },
    });

    await new Promise((r) => setTimeout(r, 200));
    const searchRequests = urls(onRequest).filter((u) => u === '/search/query');
    expect(searchRequests).toHaveLength(0);
  });

  test('fires a request when latestQuery.q is non-empty', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    renderHook(() => useGetFacetData(defaultProps), {
      initialStore: { searchStatus: 'success', latestQuery: { ...defaultQueryParams, q: 'star' } },
    });

    await waitFor(() => {
      const searchRequests = urls(onRequest).filter((u) => u === '/search/query');
      expect(searchRequests.length).toBeGreaterThan(0);
    });
  });
});

describe('useGetFacetData — searchStatus gating', () => {
  test('does not fire when searchStatus is loading', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    renderHook(() => useCompound(defaultProps), {
      initialStore: {
        searchStatus: 'loading',
        latestQuery: { ...defaultQueryParams, q: 'star' },
      },
    });

    await new Promise((r) => setTimeout(r, 200));
    const facetRequests = urls(onRequest).filter((u) => u === '/search/query');
    expect(facetRequests).toHaveLength(0);
  });

  test('does not fire when searchStatus is empty', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    renderHook(() => useCompound(defaultProps), {
      initialStore: {
        searchStatus: 'empty',
        latestQuery: { ...defaultQueryParams, q: 'star' },
      },
    });

    await new Promise((r) => setTimeout(r, 200));
    const facetRequests = urls(onRequest).filter((u) => u === '/search/query');
    expect(facetRequests).toHaveLength(0);
  });

  test('does not fire when searchStatus is error', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    renderHook(() => useCompound(defaultProps), {
      initialStore: {
        searchStatus: 'error',
        latestQuery: { ...defaultQueryParams, q: 'star' },
      },
    });

    await new Promise((r) => setTimeout(r, 200));
    const facetRequests = urls(onRequest).filter((u) => u === '/search/query');
    expect(facetRequests).toHaveLength(0);
  });

  test('fires and returns data when searchStatus is success', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    const { result } = renderHook(() => useCompound(defaultProps), {
      initialStore: {
        searchStatus: 'success',
        latestQuery: { ...defaultQueryParams, q: 'star' },
      },
    });

    await waitFor(() => {
      const facetRequests = urls(onRequest).filter((u) => u === '/search/query');
      expect(facetRequests.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(result.current.facet.treeData.length).toBeGreaterThan(0);
    });
  });

  test('regression: loading→success transition unblocks fetch and populates data', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);

    const { result } = renderHook(() => useCompound(defaultProps), {
      initialStore: {
        searchStatus: 'loading',
        latestQuery: { ...defaultQueryParams, q: 'star' },
      },
    });

    await new Promise((r) => setTimeout(r, 200));
    expect(urls(onRequest).filter((u) => u === '/search/query')).toHaveLength(0);
    expect(result.current.facet.treeData).toHaveLength(0);

    act(() => {
      result.current.setSearchStatus('success');
    });

    await waitFor(() => {
      expect(urls(onRequest).filter((u) => u === '/search/query').length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(result.current.facet.treeData.length).toBeGreaterThan(0);
    });
  });

  test('success→loading transition clears treeData synchronously', async ({ server }: TestContext) => {
    createServerListenerMocks(server);

    const { result } = renderHook(() => useCompound(defaultProps), {
      initialStore: {
        searchStatus: 'success',
        latestQuery: { ...defaultQueryParams, q: 'star' },
      },
    });

    await waitFor(() => {
      expect(result.current.facet.treeData.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.setSearchStatus('loading');
    });

    expect(result.current.facet.treeData).toHaveLength(0);
    expect(result.current.facet.totalResults).toBe(0);
  });
});
