import { useCallback } from 'react';
import { useSearchQueryParams, SearchQueryParams } from './useSearchQueryParams';
import { useSearchResults } from './useSearchResults';
import { useApplyBoostTypeToParams } from '@/lib/useApplyBoostTypeToParams';
import type { IADSApiSearchParams } from '@/api/search/types';

/**
 * Composes URL state + search results + all event handlers.
 * This is the single import for the search page shell.
 *
 * Note: depends on the appMode Zustand slice via useApplyBoostTypeToParams.
 * This is intentional — appMode is persistent user state, not URL state.
 * Tests that do not assert on boost behavior do not need to stub the store.
 *
 * extraSolrParams: dynamic URL params not managed by nuqs (e.g. fq_range used
 * in Solr local params patterns). The page component reads these from
 * router.query and passes them in so every Solr request includes the bindings.
 */
export const useSearchPage = (extraSolrParams?: Record<string, string | string[]> | null) => {
  const { params, setParams, start } = useSearchQueryParams();

  // Apply boost type from appMode slice before firing the query.
  // SearchQueryParams is cast to IADSApiSearchParams — the extra fields
  // (showHighlights, d) are compatible with the index signature.
  const { params: boostedParams } = useApplyBoostTypeToParams({
    params: params as unknown as IADSApiSearchParams,
  });

  const results = useSearchResults(boostedParams as unknown as SearchQueryParams, extraSolrParams);

  const onSubmit = useCallback(
    async (q: string) => {
      await setParams({ q, p: 1 });
    },
    [setParams],
  );

  const onSort = useCallback(
    async (sort: string[]) => {
      await setParams({ sort, p: 1 });
    },
    [setParams],
  );

  const onPageChange = useCallback(
    async (p: number) => {
      await setParams({ p });
    },
    [setParams],
  );

  const onPerPageChange = useCallback(
    async (rows: number) => {
      await setParams({ rows, p: 1 });
    },
    [setParams],
  );

  const onFacetChange = useCallback(
    async (fq: string[]) => {
      await setParams({ fq, p: 1 });
    },
    [setParams],
  );

  const onToggleHighlights = useCallback(async () => {
    await setParams({ showHighlights: !params.showHighlights });
  }, [setParams, params.showHighlights]);

  return {
    params,
    start,
    results,
    handlers: {
      onSubmit,
      onSort,
      onPageChange,
      onPerPageChange,
      onFacetChange,
      onToggleHighlights,
    },
  };
};
