import { AppState, useStore } from '@/store';
import { useGetHighlights } from '@/api/search/search';

const selectors = {
  latestQuery: (state: AppState) => state.latestQuery,
  showHighlights: (state: AppState) => state.showHighlights,
};

/**
 * Hook to get highlight data
 *
 * This will fetch highlights based on the latest query in the global store.
 * It also watches the global switch for `showHighlights`, so no fetching will happen unless that is set
 */
export const useHighlights = () => {
  const latestQuery = useStore(selectors.latestQuery);
  const showHighlights = useStore(selectors.showHighlights);

  const { isFetching, data } = useGetHighlights(latestQuery, {
    // will not trigger unless the toggle has been set
    enabled: showHighlights,
    notifyOnChangeProps: ['data', 'isFetching'],
  });

  // Do this first to maintain results ordering
  const highlights = data?.docs.map(({ id }) => data.highlighting[id]) ?? [];

  return { showHighlights, highlights, isFetchingHighlights: isFetching };
};
