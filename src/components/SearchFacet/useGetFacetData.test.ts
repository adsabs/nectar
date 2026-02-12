import { describe, test, expect, vi, TestContext } from 'vitest';
import { renderHook, waitFor, createServerListenerMocks, urls } from '@/test-utils';
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

describe('useGetFacetData', () => {
  test('does not fire a request when latestQuery.q is empty', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    renderHook(() => useGetFacetData(defaultProps), {
      initialStore: { latestQuery: { ...defaultQueryParams, q: '' } },
    });

    await new Promise((r) => setTimeout(r, 200));
    const searchRequests = urls(onRequest).filter((u) => u === '/search/query');
    expect(searchRequests).toHaveLength(0);
  });

  test('does not fire a request when latestQuery.q is whitespace-only', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    renderHook(() => useGetFacetData(defaultProps), {
      initialStore: { latestQuery: { ...defaultQueryParams, q: '   ' } },
    });

    await new Promise((r) => setTimeout(r, 200));
    const searchRequests = urls(onRequest).filter((u) => u === '/search/query');
    expect(searchRequests).toHaveLength(0);
  });

  test('fires a request when latestQuery.q is non-empty', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    renderHook(() => useGetFacetData(defaultProps), {
      initialStore: { latestQuery: { ...defaultQueryParams, q: 'star' } },
    });

    await waitFor(() => {
      const searchRequests = urls(onRequest).filter((u) => u === '/search/query');
      expect(searchRequests.length).toBeGreaterThan(0);
    });
  });
});
