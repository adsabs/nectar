import { useGetHighlights } from '@/api/search/search';
import { IADSApiSearchParams } from '@/api/search/types';

const DISABLED_PARAMS: IADSApiSearchParams = { q: '' };

// Fetches highlights for the given search params, which must match the params
// of the visible results (including start/rows) so highlights zip with docs by
// index. No fetching happens unless showHighlights is on and params are given.
export const useHighlights = (params: IADSApiSearchParams | undefined, showHighlights: boolean) => {
  const enabled = showHighlights && typeof params !== 'undefined';

  const { isFetching, data } = useGetHighlights(params ?? DISABLED_PARAMS, {
    enabled,
    notifyOnChangeProps: ['data', 'isFetching'],
  });

  // Do this first to maintain results ordering
  const highlights = data?.docs.map(({ id }) => data.highlighting[id]) ?? [];

  return { showHighlights, highlights, isFetchingHighlights: isFetching };
};
