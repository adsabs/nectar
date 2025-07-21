import { Dispatch, useEffect, useRef } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { useDebouncedCallback } from 'use-debounce';
import { useRouter } from 'next/router';

/**
 * Synchronizes the search term with the global query from the intermediate query state.
 * This hook ensures that the local search input state is in sync with the URL query parameters.
 * This should only happen once when the component mounts, because we want to keep the flow one-way here, syncing only as much
 * as necessary to ensure the search input reflects the global query state.
 * @param props
 */
export const useSyncWithGlobal = (props: { searchTerm: string; dispatch: Dispatch<SearchInputAction> }) => {
  const { query: globalQuery, updateQuery } = useIntermediateQuery();
  const { query } = useRouter();
  const { searchTerm, dispatch } = props;
  const hasSynced = useRef(false);
  const debouncedUpdateQuery = useDebouncedCallback((q: string) => updateQuery(q), 500);

  useEffect(() => {
    if (hasSynced.current) {
      return; // Skip if already synced
    }
    if (query?.q && query.q.length > 0 && query.q !== globalQuery) {
      // If the global query is different from the current search term, update it
      // give the URL query priority over the global query
      dispatch({
        type: 'SET_SEARCH_TERM',
        payload: { query: query.q as string, cursorPosition: (query.q as string).length },
      });
    } else if (globalQuery && globalQuery.length > 0 && searchTerm !== globalQuery) {
      // If the global query is set and different from the current search term, update it
      dispatch({ type: 'SET_SEARCH_TERM', payload: { query: globalQuery, cursorPosition: globalQuery.length } });
    }
    // Set hasSynced flag to true after the initial sync whether we updated the search term or not
    hasSynced.current = true;
  }, [searchTerm, globalQuery, dispatch, query?.q]);

  // on local changes we want to flush changes to the global store
  const prev = useRef<string>(searchTerm);

  useEffect(() => {
    if (prev.current !== searchTerm) {
      debouncedUpdateQuery(searchTerm);
      prev.current = searchTerm;
    }
  }, [searchTerm, debouncedUpdateQuery]);
};
