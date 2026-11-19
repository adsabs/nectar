import { describe, test, expect, vi, TestContext } from 'vitest';
import { rest } from 'msw';
import { renderHook, waitFor, act, createServerListenerMocks, urls } from '@/test-utils';
import { useStore } from '@/store';
import { IUseGetFacetDataProps } from './useGetFacetData';
import { useGetFacetData } from './useGetFacetData';
import { defaultQueryParams } from '@/store/slices/search';
import { FacetField, IBucket } from '@/api/search/types';
import { ApiTargets } from '@/api/models';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { generateSearchResponse } from '@/mocks/generators/search';

vi.mock('@/components/SearchFacet/store/FacetStore', () => ({
  useFacetStore: () => vi.fn(),
}));

const defaultProps = {
  field: 'author_facet_hier' as FacetField,
  prefix: '0/',
  level: 'root' as const,
};

const simbadChildProps: IUseGetFacetDataProps = {
  field: 'simbad_object_facet_hier' as FacetField,
  prefix: '1/Other/',
  level: 'child',
  hasChildren: true,
};

const nedChildProps: IUseGetFacetDataProps = {
  field: 'ned_object_facet_hier' as FacetField,
  prefix: '1/Galaxy/',
  level: 'child',
  hasChildren: true,
};

const childSearchStore = { searchStatus: 'success' as const, latestQuery: { ...defaultQueryParams, q: 'star' } };

type FacetBucket = Pick<IBucket, 'val' | 'count'>;

const mockFacetBuckets = (server: TestContext['server'], field: FacetField, buckets: Array<FacetBucket>) =>
  server.use(
    rest.get(apiHandlerRoute(ApiTargets.SEARCH), (_req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json(
          generateSearchResponse({
            facets: { [field]: { numBuckets: buckets.length, buckets: buckets as Array<IBucket> } },
          }),
        ),
      ),
    ),
  );

const mockObjectsResponse = (server: TestContext['server'], body: unknown) =>
  server.use(
    rest.post(apiHandlerRoute(ApiTargets.SERVICE_OBJECTS, ''), (_req, res, ctx) =>
      res(ctx.status(200), ctx.json(body)),
    ),
  );

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

describe('useGetFacetData — SIMBAD object name resolution', () => {
  const simbadBuckets: Array<FacetBucket> = [
    { val: '1/Other/1382582', count: 2 },
    { val: '1/Other/2267833', count: 1 },
  ];

  const waitForObjectsToSettle = async (
    onRequest: ReturnType<typeof createServerListenerMocks>['onRequest'],
    result: { current: ReturnType<typeof useGetFacetData> },
  ) => {
    await waitFor(() => {
      expect(urls(onRequest).filter((url) => url === ApiTargets.SERVICE_OBJECTS)).toHaveLength(1);
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  };

  test('falls back to raw ids when the objects service returns an error body at 200', async ({
    server,
  }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockFacetBuckets(server, simbadChildProps.field, simbadBuckets);
    mockObjectsResponse(server, {
      Error: 'Unable to get results!',
      'Error Info': 'SIMBAD request failed (not timeout): [Errno -5] No address associated with hostname',
    });

    const { result } = renderHook(() => useGetFacetData(simbadChildProps), { initialStore: childSearchStore });

    await waitForObjectsToSettle(onRequest, result);

    expect(result.current.treeData.map((item) => item.val)).toEqual(['1/Other/1382582', '1/Other/2267833']);
  });

  test('resolves what it can and leaves the rest as raw ids when the map is partial', async ({
    server,
  }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockFacetBuckets(server, simbadChildProps.field, simbadBuckets);
    mockObjectsResponse(server, { '1382582': { id: '1382582', canonical: 'NGC 1068' } });

    const { result } = renderHook(() => useGetFacetData(simbadChildProps), { initialStore: childSearchStore });

    await waitForObjectsToSettle(onRequest, result);

    expect(result.current.treeData.map((item) => item.val)).toEqual(['1/Other/NGC 1068', '1/Other/2267833']);
  });

  test('resolves every id to its canonical name when the objects service answers in full', async ({
    server,
  }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockFacetBuckets(server, simbadChildProps.field, simbadBuckets);
    mockObjectsResponse(server, {
      '1382582': { id: '1382582', canonical: 'NGC 1068' },
      '2267833': { id: '2267833', canonical: 'M 87' },
    });

    const { result } = renderHook(() => useGetFacetData(simbadChildProps), { initialStore: childSearchStore });

    await waitForObjectsToSettle(onRequest, result);

    expect(result.current.treeData.map((item) => item.val)).toEqual(['1/Other/NGC 1068', '1/Other/M 87']);
  });

  test('treats a blank canonical name as unresolved and keeps the raw id', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockFacetBuckets(server, simbadChildProps.field, simbadBuckets);
    mockObjectsResponse(server, {
      '1382582': { id: '1382582', canonical: '' },
      '2267833': { id: '2267833', canonical: '   ' },
    });

    const { result } = renderHook(() => useGetFacetData(simbadChildProps), { initialStore: childSearchStore });

    await waitForObjectsToSettle(onRequest, result);

    expect(result.current.treeData.map((item) => item.val)).toEqual(['1/Other/1382582', '1/Other/2267833']);
  });

  test('does not call the objects service for NED facet children', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    const nedBuckets: Array<FacetBucket> = [
      { val: '1/Galaxy/ABELL_2744', count: 2 },
      { val: '1/Galaxy/Bullet_Cluster', count: 1 },
    ];
    mockFacetBuckets(server, nedChildProps.field, nedBuckets);

    const { result } = renderHook(() => useGetFacetData(nedChildProps), { initialStore: childSearchStore });

    await waitFor(() => {
      expect(result.current.treeData.map((item) => item.val)).toEqual([
        '1/Galaxy/ABELL_2744',
        '1/Galaxy/Bullet_Cluster',
      ]);
    });

    expect(urls(onRequest).filter((url) => url === ApiTargets.SERVICE_OBJECTS)).toHaveLength(0);
  });
});
