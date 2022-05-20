import { IADSApiSearchParams, IADSApiSearchResponse, SEARCH_API_KEYS } from '@api';
import { useMemo, useState } from 'react';
import { Query, useQueryClient } from 'react-query';

export const useGetLatestQuery = () => {
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryCache();

  const [query, setQuery] = useState<Query<IADSApiSearchResponse>>(() =>
    cache.find<IADSApiSearchResponse>(SEARCH_API_KEYS.primary),
  );

  const value = useMemo(
    () => ({
      query: query?.queryKey[1] as IADSApiSearchParams,
      result: query?.state.data,
      state: query?.state,
    }),
    [query, query?.state.status],
  );

  return value;
};
