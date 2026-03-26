import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSearchQueryParams, SearchQueryParams } from './useSearchQueryParams';
import { useSearchResults } from './useSearchResults';
import { useApplyBoostTypeToParams } from '@/lib/useApplyBoostTypeToParams';
import { useStore, AppState } from '@/store';
import type { IADSApiSearchParams } from '@/api/search/types';
import type { NumPerPageType } from '@/types';

const selectors = {
  clearAllSelected: (state: AppState) => state.clearAllSelected,
  setNumPerPage: (state: AppState) => state.setNumPerPage,
  numPerPage: (state: AppState) => state.numPerPage,
};

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
  const { params, setParams } = useSearchQueryParams();
  const clearAllSelected = useStore(selectors.clearAllSelected);
  const setNumPerPage = useStore(selectors.setNumPerPage);
  const numPerPage = useStore(selectors.numPerPage);
  const { query: routerQuery } = useRouter();

  // If rows is absent from the URL, fall back to the persisted preference
  // so navigating from home/abstract to search respects the user's page size.
  const resolvedRows = routerQuery.rows == null ? numPerPage : params.rows;
  const resolvedParams = useMemo(() => ({ ...params, rows: resolvedRows }), [params, resolvedRows]);
  const start = (resolvedParams.p - 1) * resolvedRows;

  // Apply boost type from appMode slice before firing the query.
  // SearchQueryParams is cast to IADSApiSearchParams — the extra fields
  // (showHighlights, d) are compatible with the index signature.
  const { params: boostedParams } = useApplyBoostTypeToParams({
    params: resolvedParams as unknown as IADSApiSearchParams,
  });

  const results = useSearchResults(boostedParams as unknown as SearchQueryParams, extraSolrParams);

  const onSubmit = useCallback(
    async (q: string) => {
      clearAllSelected();
      await setParams({ q, p: 1 });
    },
    [setParams, clearAllSelected],
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
      // Persist to shared Zustand preference so other pages (e.g. Citation
      // Helper) pick up the user's preferred page size.
      setNumPerPage(rows as NumPerPageType);
      await setParams({ rows, p: 1 });
    },
    [setParams, setNumPerPage],
  );

  const onFacetChange = useCallback(
    async (fq: string[]) => {
      clearAllSelected();
      await setParams({ fq, p: 1 });
    },
    [setParams, clearAllSelected],
  );

  const onToggleHighlights = useCallback(async () => {
    await setParams({ showHighlights: !params.showHighlights });
  }, [setParams, params.showHighlights]);

  return {
    params: resolvedParams,
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
