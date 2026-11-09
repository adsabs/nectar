import { useQueryClient } from '@tanstack/react-query';
import { last } from 'ramda';

import { SEARCH_API_KEYS } from '@/api/search/ui-tags';
import { IADSApiSearchResponse } from '@/api/search/types';

export const useLatestSearchNumFound = (): number | undefined => {
  const queryClient = useQueryClient();
  const queries = queryClient.getQueriesData<IADSApiSearchResponse>({
    predicate: (query) =>
      query.queryKey[0] === SEARCH_API_KEYS.primary || query.queryKey[0] === SEARCH_API_KEYS.primaryPrimer,
  });
  const lastQuery = queries.length > 1 ? last(queries) : null;
  return lastQuery?.[1]?.response?.numFound;
};
