import { Dispatch, useEffect, useRef } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Synchronizes the search term with the global query from the intermediate query state.
 * This should only happen once when the component mounts, because we want to keep the flow one-way here, syncing only as much
 * as necessary to ensure the search input reflects the global query state.
 * @param props
 */
export const useSyncWithGlobal = (props: { searchTerm: string; dispatch: Dispatch<SearchInputAction> }) => {
  const { query: globalQuery, updateQuery } = useIntermediateQuery();
  const { searchTerm, dispatch } = props;
  const hasSynced = useRef(false);
  const debouncedUpdateQuery = useDebouncedCallback((q: string) => updateQuery(q), 500);

  useEffect(() => {
    if (globalQuery && searchTerm !== globalQuery && !hasSynced.current) {
      dispatch({ type: 'SET_SEARCH_TERM', payload: { query: globalQuery, cursorPosition: globalQuery.length } });
      hasSynced.current = true;
    }
  }, [searchTerm, globalQuery, dispatch]);

  // on local changes we want to flush changes to the global store
  useEffect(() => {
    debouncedUpdateQuery(searchTerm);
  }, [searchTerm, debouncedUpdateQuery]);
};
