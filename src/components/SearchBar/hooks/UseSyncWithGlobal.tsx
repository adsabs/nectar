import { Dispatch, useEffect } from 'react';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useRouter } from 'next/router';
import { parseQueryFromUrl } from '@/utils/common/search';

/**
 * Synchronizes the search bar input with the URL's `q` param.
 * On route change, updates the local search input to reflect the new URL query.
 * On mount, syncs the initial URL `q` into the input state.
 */
export const useSyncWithGlobal = (props: { searchTerm: string; dispatch: Dispatch<SearchInputAction> }) => {
  const { dispatch } = props;
  const { query: urlQuery, events } = useRouter();

  useEffect(() => {
    const handler = (url: string) => {
      if (url.startsWith('/search')) {
        const { q } = parseQueryFromUrl(url) as { q: string | undefined };
        const safeQ = q ?? '';
        dispatch({
          type: 'SET_SEARCH_TERM',
          payload: { query: safeQ, cursorPosition: safeQ.length },
        });
      }
    };
    events.on('routeChangeStart', handler);
    return () => {
      events.off('routeChangeStart', handler);
    };
  }, [dispatch, events]);

  useEffect(() => {
    if (urlQuery?.q) {
      const query = urlQuery.q as string;
      dispatch({
        type: 'SET_SEARCH_TERM',
        payload: { query, cursorPosition: query.length },
      });
    }
  }, [dispatch, urlQuery.q]);
};
