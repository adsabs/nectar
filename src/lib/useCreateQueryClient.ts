import { useState } from 'react';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { handleQueryError } from './errorHandler';

export const useCreateQueryClient = () => {
  const queryCache = new QueryCache({
    onError: (error, query) => {
      // check if we should skip handling the error here
      if (query.meta?.skipGlobalErrorHandler) {
        return;
      }

      // Use global error handler
      handleQueryError(error, {
        queryKey: query.queryKey,
        queryHash: query.queryHash,
        state: query.state.status,
      });
    },
  });

  const mutationCache = new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // check if we should skip handling the error here
      if (mutation.meta?.skipGlobalErrorHandler) {
        return;
      }

      // Use global error handler
      handleQueryError(error, {
        mutationId: mutation.mutationId,
        state: mutation.state.status,
        variables: mutation.state.variables,
      });
    },
  });

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            staleTime: Infinity,
            retry: false,
            retryOnMount: false,
          },
        },
        queryCache,
        mutationCache,
      }),
  );

  return queryClient;
};
