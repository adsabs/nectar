import { useGetHighlights } from '@/api/search/search';
import { IADSApiSearchParams } from '@/api/search/types';

/**
 * Hook to get highlight data.
 *
 * Accepts params and showHighlights as arguments instead of reading from the
 * global store, so it can be driven from URL state on the search page.
 */
export const useHighlights = (params: IADSApiSearchParams, showHighlights: boolean) => {
  const { isFetching, data } = useGetHighlights(params, {
    // will not trigger unless the toggle has been set
    enabled: showHighlights,
    notifyOnChangeProps: ['data', 'isFetching'],
  });

  // Do this first to maintain results ordering
  const highlights = data?.docs.map(({ id }) => data.highlighting[id]) ?? [];

  return { showHighlights, highlights, isFetchingHighlights: isFetching };
};
