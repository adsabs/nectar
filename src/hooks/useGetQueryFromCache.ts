import { IADSApiSearchParams, IADSApiSearchResponse } from '@api';
import { useQueryClient } from 'react-query';

export const useGetQueryFromCache = () => {
  const queryClient = useQueryClient();
  const query = queryClient.getQueryCache().find<IADSApiSearchResponse>(['search'], { exact: false });

  if (!query) {
    return {};
  }

  return { query: query.queryKey[1] as IADSApiSearchParams, result: query.state.data };
};
