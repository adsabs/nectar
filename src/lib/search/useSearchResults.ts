import { useEffect, useState } from 'react';

import { useSearch } from '@/api/search/search';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { SearchStatus } from '@/types';

export const SLOW_SEARCH_THRESHOLD_MS = 5000;

export interface IUseSearchResultsOptions {
  // whether the search should run at all — evaluated first in the status
  // derivation so a disabled query is always `idle`, even with retained data
  enabled?: boolean;
}

// Wraps useSearch() for the search page. Selects the full response (numFound
// and responseHeader.partialResults live outside the default `response`
// selection) and derives the search lifecycle status from the query state —
// replacing the store-written searchStatus field.
//
// keepPreviousData keeps prior results visible during page/sort transitions.
// Under it, a NEW query key does not set isLoading — it sets isFetching with
// isPreviousData — so that combination must also count as `loading` to keep
// facets gated while a genuinely new search is in flight. A background
// refetch of the same key (isFetching, not previous) stays `success`.
export const useSearchResults = (params: IADSApiSearchParams, { enabled = true }: IUseSearchResultsOptions = {}) => {
  const { data, isLoading, isFetching, isError, isSuccess, isPreviousData, error, refetch } =
    useSearch<IADSApiSearchResponse>(params, {
      select: (data) => data,
      keepPreviousData: true,
      enabled,
    });

  const numFound = data?.response?.numFound ?? 0;

  const searchStatus: SearchStatus = !enabled
    ? 'idle'
    : isError
    ? 'error'
    : isLoading || (isFetching && isPreviousData)
    ? 'loading'
    : isSuccess && numFound === 0
    ? 'empty'
    : isSuccess
    ? 'success'
    : 'loading';

  // Flag searches that exceed the threshold so the page can show a wait notice.
  // Mirrors the pre-rewrite behavior: the timer runs for any in-flight fetch.
  const [isSlowSearch, setIsSlowSearch] = useState(false);
  useEffect(() => {
    if (!enabled || !(isLoading || isFetching)) {
      setIsSlowSearch(false);
      return;
    }
    const timeoutId = setTimeout(() => setIsSlowSearch(true), SLOW_SEARCH_THRESHOLD_MS);
    return () => clearTimeout(timeoutId);
  }, [enabled, isLoading, isFetching]);

  return {
    docs: data?.response?.docs ?? [],
    numFound,
    isPartialResults: Boolean(data?.responseHeader?.partialResults),
    searchStatus,
    isSlowSearch,
    isLoading,
    isFetching,
    isSuccess,
    isError,
    error,
    refetch,
  };
};
