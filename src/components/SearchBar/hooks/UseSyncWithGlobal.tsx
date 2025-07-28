import { Dispatch, useEffect, useRef } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { useDebouncedCallback } from 'use-debounce';
import { useRouter } from 'next/router';
import { parseQueryFromUrl } from '@/utils/common/search';

/**
 * Synchronizes the search term with the global query from the intermediate query state.
 * This hook ensures that the local search input state is in sync with the URL query parameters.
 * This should only happen once when the component mounts, because we want to keep the flow one-way here, syncing only as much
 * as necessary to ensure the search input reflects the global query state.
 * @param props
 * @param options
 */
export const useSyncWithGlobal = (
  props: { searchTerm: string; dispatch: Dispatch<SearchInputAction> },
  options?: {
    /** How long to debounce the updates to the global store */
    updateWait: number;
  },
) => {
  const { updateQuery, clearQuery } = useIntermediateQuery();
  const { query: urlQuery, events } = useRouter();
  const { searchTerm, dispatch } = props;
  const debouncedUpdateQuery = useDebouncedCallback((q: string) => updateQuery(q), options?.updateWait ?? 500);

  useEffect(() => {
    const handler = (url: string) => {
      if (url.startsWith('/search')) {
        const { q } = parseQueryFromUrl(url) as { q: string | undefined };
        dispatch({
          type: 'SET_SEARCH_TERM',
          payload: { query: q, cursorPosition: q.length },
        });
      }
    };
    events.on('routeChangeStart', handler);
    return () => {
      events.off('routeChangeStart', handler);
    };
  }, [clearQuery, dispatch, events]);

  useEffect(() => {
    if (urlQuery?.q) {
      const query = urlQuery.q as string;
      dispatch({
        type: 'SET_SEARCH_TERM',
        payload: { query: query as string, cursorPosition: query.length },
      });
    }
  }, [dispatch, urlQuery.q]);

  // on local changes we want to flush changes to the global store
  const prev = useRef<string>(searchTerm);

  // update the global query when debounced by some time
  useEffect(() => {
    if (prev.current !== searchTerm) {
      debouncedUpdateQuery(searchTerm);
      prev.current = searchTerm;
    }
  }, [searchTerm, debouncedUpdateQuery]);
};
