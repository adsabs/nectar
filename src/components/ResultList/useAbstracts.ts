import { useMemo } from 'react';
import { AppState, useStore } from '@/store';
import { useGetAbstracts } from '@/api/search/search';

const selectors = {
  latestQuery: (state: AppState) => state.latestQuery,
  showAbstracts: (state: AppState) => state.showAbstracts,
};

/**
 * Bulk-fetch abstracts for the latest query, gated on the global
 * `showAbstracts` toggle (mirrors useHighlights). Returns a bibcode ->
 * abstract map, so callers don't rely on positional alignment with results.
 */
export const useAbstracts = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const latestQuery = useStore(selectors.latestQuery);
  const showAbstracts = useStore(selectors.showAbstracts);

  const { isFetching, data } = useGetAbstracts(latestQuery, {
    enabled: showAbstracts && enabled,
    notifyOnChangeProps: ['data', 'isFetching'],
  });

  const abstracts = useMemo(() => {
    const map: Record<string, string> = {};
    data?.docs.forEach((doc) => {
      if (doc.bibcode && typeof doc.abstract === 'string') {
        map[doc.bibcode] = doc.abstract;
      }
    });
    return map;
  }, [data]);

  return { showAbstracts, abstracts, isFetchingAbstracts: isFetching };
};
