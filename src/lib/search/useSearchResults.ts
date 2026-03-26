import { useEffect, useMemo, useState } from 'react';
import { useSearch } from '@/api/search/search';
import { defaultFields } from '@/api/search/models';
import type { IADSApiSearchResponse } from '@/api/search/types';
import type { SearchQueryParams } from './useSearchQueryParams';
import { filterBoundFq } from './filterBoundFq';

const SLOW_SEARCH_THRESHOLD_MS = 5000;
const EMPTY_DOCS: IADSApiSearchResponse['response']['docs'] = [];

// Custom selector to surface both response data and the responseHeader
// (responseHeader lives on the top-level response, not on response.response).
const searchResultsSelector = (data: IADSApiSearchResponse) => ({
  docs: data.response.docs,
  numFound: data.response.numFound,
  isPartialResults: data.responseHeader?.partialResults ?? false,
});

/**
 * Wraps useSearch() with the typed params from useSearchQueryParams.
 * Owns slow-search detection. No Zustand dependency.
 *
 * extraSolrParams: dynamic URL params not managed by nuqs (e.g. fq_range used
 * in Solr local params patterns). Must be forwarded verbatim to the Solr API.
 */
export const useSearchResults = (
  params: SearchQueryParams,
  extraSolrParams?: Record<string, string | string[]> | null,
) => {
  const [isSlowSearch, setIsSlowSearch] = useState(false);

  const searchParams = useMemo(
    () => ({
      q: params.q,
      sort: params.sort,
      start: (params.p - 1) * params.rows,
      rows: params.rows,
      fq: filterBoundFq(params.fq, extraSolrParams),
      fl: defaultFields,
      ...extraSolrParams,
    }),
    [params.q, params.sort, params.p, params.rows, params.fq, extraSolrParams],
  );

  const {
    data,
    isInitialLoading: isLoading,
    isFetching,
    refetch,
    isError,
    error,
  } = useSearch(searchParams, {
    select: searchResultsSelector,
    enabled: params.q.trim().length > 0,
    keepPreviousData: true,
    notifyOnChangeProps: ['data', 'isLoading', 'isError', 'isFetching', 'error'],
  });

  // Slow-search detection: flag if loading exceeds threshold
  useEffect(() => {
    if (!isLoading) {
      setIsSlowSearch(false);
      return;
    }
    const timer = setTimeout(() => setIsSlowSearch(true), SLOW_SEARCH_THRESHOLD_MS);
    return () => clearTimeout(timer);
  }, [isLoading, params.q]);

  return {
    docs: data?.docs ?? EMPTY_DOCS,
    numFound: data?.numFound ?? 0,
    isLoading,
    isFetching,
    refetch,
    isError,
    error,
    isPartialResults: data?.isPartialResults ?? false,
    isSlowSearch,
  };
};
