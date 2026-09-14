import { MockedRequest } from 'msw';
import { beforeEach, expect, Mock, test, TestContext } from 'vitest';
import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import api from '@/api/api';
import { ApiTargets } from '@/api/models';
import { createServerListenerMocks, DefaultProviders } from '@/test-utils';
import {
  SEARCH_API_KEYS,
  SEARCH_NAMESPACES,
  useBigQuerySearch,
  useCustomFacetSearch,
  useGetAbstract,
  useGetAbstractPreview,
  useGetAbstracts,
  useGetAffiliations,
  useGetCitations,
  useGetCoreads,
  useGetCredits,
  useGetHighlights,
  useGetMentions,
  useGetReferences,
  useGetSearchFacet,
  useGetSearchFacetCounts,
  useGetSearchFacetJSON,
  useGetSearchStats,
  useGetSimilar,
  useGetSingleRecord,
  useGetToc,
  useSearch,
  useSearchInfinite,
} from '@/api/search/search';

const mockUserData = {
  username: 'anonymous@ads',
  access_token: 'foo_access_token',
  anonymous: true,
  expires_at: '99999999999999999',
};

const wrapper = ({ children }: { children: ReactNode }) => <DefaultProviders options={{}}>{children}</DefaultProviders>;

const tagsFor = (onRequest: Mock, pathname: string): Array<string | null> =>
  onRequest.mock.calls
    .map((call) => call[0] as MockedRequest)
    .filter((request) => request.url.pathname === pathname)
    .map((request) => request.url.searchParams.get('ui_tag'));

// Full provider tree + real MSW round trip runs close to waitFor's 1s
// default under full-suite load.
const settled = (isSuccess: () => boolean) => waitFor(() => expect(isSuccess()).toBe(true), { timeout: 10_000 });

beforeEach(() => {
  localStorage.clear();
  api.reset();
  api.setUserData(mockUserData);
});

const BIBCODE = '2021ApJ...123..456A';

// Every hook that hits /search/query, paired with its expected tag.
const searchHooks: Array<[string, () => { isSuccess: boolean }, string]> = [
  [
    'useSearch',
    () => useSearch({ q: 'star', rows: 10 }, { namespace: SEARCH_API_KEYS.primary }),
    SEARCH_API_KEYS.primary,
  ],
  ['useGetHighlights', () => useGetHighlights({ q: 'star', rows: 10 }), SEARCH_API_KEYS.highlight],
  ['useGetAbstracts', () => useGetAbstracts({ q: 'star', rows: 10 }), SEARCH_API_KEYS.abstracts],
  ['useGetCitations', () => useGetCitations({ bibcode: BIBCODE }), SEARCH_API_KEYS.citations],
  ['useGetReferences', () => useGetReferences({ bibcode: BIBCODE }), SEARCH_API_KEYS.references],
  ['useGetCredits', () => useGetCredits({ bibcode: BIBCODE }), SEARCH_API_KEYS.credits],
  ['useGetMentions', () => useGetMentions({ bibcode: BIBCODE }), SEARCH_API_KEYS.mentions],
  ['useGetCoreads', () => useGetCoreads({ bibcode: BIBCODE }), SEARCH_API_KEYS.coreads],
  ['useGetSimilar', () => useGetSimilar({ bibcode: BIBCODE }), SEARCH_API_KEYS.similar],
  ['useGetToc', () => useGetToc({ bibcode: BIBCODE }), SEARCH_API_KEYS.toc],
  ['useGetAbstract', () => useGetAbstract({ id: BIBCODE }), SEARCH_API_KEYS.abstract],
  ['useGetAffiliations', () => useGetAffiliations({ bibcode: BIBCODE }), SEARCH_API_KEYS.affiliations],
  ['useGetAbstractPreview', () => useGetAbstractPreview({ bibcode: BIBCODE }), SEARCH_API_KEYS.preview],
  ['useGetSingleRecord', () => useGetSingleRecord({ id: BIBCODE }), SEARCH_API_KEYS.record],
  ['useGetSearchStats', () => useGetSearchStats({ q: 'star', sort: ['citation_count desc'] }), SEARCH_API_KEYS.stats],
  ['useGetSearchFacetCounts', () => useGetSearchFacetCounts({ q: 'star' }), SEARCH_API_KEYS.facet],
  ['useGetSearchFacet', () => useGetSearchFacet({ q: 'star' }), SEARCH_API_KEYS.facet],
  [
    'useGetSearchFacetJSON',
    () => useGetSearchFacetJSON({ q: 'star', field: 'author_facet_hier' }),
    SEARCH_API_KEYS.facet,
  ],
  ['useCustomFacetSearch', () => useCustomFacetSearch({ q: 'star' }), SEARCH_API_KEYS.facet],
  [
    'useSearchInfinite',
    () => useSearchInfinite({ q: 'star', rows: 10 }, { namespace: SEARCH_API_KEYS.infinite }),
    SEARCH_API_KEYS.infinite,
  ],
];

searchHooks.forEach(([name, hook, expected]) => {
  test(`${name} tags its request ${expected}`, async ({ server }: TestContext) => {
    const { onRequest: onReq } = createServerListenerMocks(server);

    const { result } = renderHook(hook, { wrapper });
    await settled(() => result.current.isSuccess);

    expect(tagsFor(onReq, ApiTargets.SEARCH)).toEqual([expected]);
  });
});

test('a namespace overrides the derived tag', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  const { result } = renderHook(
    () => useSearch({ q: 'star', rows: 10 }, { namespace: SEARCH_NAMESPACES.orcidAddWorks }),
    { wrapper },
  );
  await settled(() => result.current.isSuccess);

  expect(tagsFor(onReq, ApiTargets.SEARCH)).toEqual([SEARCH_NAMESPACES.orcidAddWorks]);
});

test('a namespace partitions one shared cache', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  // One QueryClient: separate clients would refetch regardless of namespacing.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, cacheTime: Infinity } },
  });
  const shared = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const params = { q: 'star', rows: 10 };

  const mainline = renderHook(() => useSearch(params, { namespace: SEARCH_API_KEYS.primary }), {
    wrapper: shared,
  });
  await settled(() => mainline.result.current.isSuccess);

  const orcid = renderHook(() => useSearch(params, { namespace: SEARCH_NAMESPACES.orcidAddWorks }), {
    wrapper: shared,
  });
  await settled(() => orcid.result.current.isSuccess);

  expect(tagsFor(onReq, ApiTargets.SEARCH)).toEqual([SEARCH_API_KEYS.primary, SEARCH_NAMESPACES.orcidAddWorks]);

  // The search page derives numFound from this; it must see only itself.
  const primaryEntries = client.getQueriesData([SEARCH_API_KEYS.primary]);
  expect(primaryEntries).toHaveLength(1);

  const again = renderHook(() => useSearch(params, { namespace: SEARCH_NAMESPACES.orcidAddWorks }), {
    wrapper: shared,
  });
  await settled(() => again.result.current.isSuccess);
  expect(tagsFor(onReq, ApiTargets.SEARCH)).toHaveLength(2);
});

test('a namespaced preview is distinguishable from the results-list preview', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  const { result } = renderHook(
    () => useGetAbstractPreview({ bibcode: BIBCODE }, { namespace: SEARCH_NAMESPACES.librariesItemPreview }),
    { wrapper },
  );
  await settled(() => result.current.isSuccess);

  expect(tagsFor(onReq, ApiTargets.SEARCH)).toEqual([SEARCH_NAMESPACES.librariesItemPreview]);
});

test('the bigquery mutation carries a literal tag', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  const { result } = renderHook(() => useBigQuerySearch(), { wrapper });
  result.current.mutate({ bibcodes: [BIBCODE], rows: 10 });
  await settled(() => result.current.isSuccess);

  expect(tagsFor(onReq, ApiTargets.BIGQUERY)).toEqual([SEARCH_API_KEYS.bigquery]);
});

test('a caller-supplied meta cannot clobber the params the fetcher needs', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  const { result } = renderHook(
    () => useSearch({ q: 'star', rows: 10 }, { namespace: SEARCH_API_KEYS.primary, meta: { unrelated: true } }),
    { wrapper },
  );
  await settled(() => result.current.isSuccess);

  const [request] = onReq.mock.calls
    .map((call) => call[0] as MockedRequest)
    .filter((r) => r.url.pathname === ApiTargets.SEARCH);
  expect(request.url.searchParams.get('q')).toEqual('star');
  expect(tagsFor(onReq, ApiTargets.SEARCH)).toEqual([SEARCH_API_KEYS.primary]);
});

test('a caller-supplied meta does not drop the facet post-transformers', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  const { result } = renderHook(
    () => useGetSearchFacetJSON({ q: 'star', field: 'author_facet_hier' }, { meta: { unrelated: true } }),
    { wrapper },
  );
  await settled(() => result.current.isSuccess);

  // Dropping postTransformers throws inside fetchSearch.
  expect(result.current.isError).toBe(false);
  expect(tagsFor(onReq, ApiTargets.SEARCH)).toEqual([SEARCH_API_KEYS.facet]);
});
