import { fetchSearch, IADSApiSearchParams, searchKeys, SEARCH_API_KEYS } from '@api';
import { AppState, useStore, useStoreApi } from '@store';
import { omit } from 'ramda';
import { useCallback } from 'react';
import { useQueryClient } from 'react-query';

const updateQuerySelector = (state: AppState) => state.updateQuery;
const submitQuerySelector = (state: AppState) => state.submitQuery;
const cleanParams = omit(['fl', 'p']);

export const useUpdateQuery = () => {
  const updateQuery = useStore(updateQuerySelector);
  const submitQuery = useStore(submitQuerySelector);
  const store = useStoreApi();
  const queryClient = useQueryClient();

  const prepareSearch = useCallback((params: IADSApiSearchParams, prefetch?: boolean) => {
    updateQuery(params);
    if (prefetch) {
      const query = store.getState().query;
      void queryClient.prefetchQuery({
        queryKey: SEARCH_API_KEYS.primary,
        queryHash: JSON.stringify(searchKeys.primary(cleanParams(query))),
        queryFn: fetchSearch,
        meta: { params: query },
      });
    }
    submitQuery();
  }, []);

  return { prepareSearch };
};
