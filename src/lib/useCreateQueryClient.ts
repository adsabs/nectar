import axios from 'axios';
import { useState } from 'react';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { logger } from '@/logger';

export const useCreateQueryClient = () => {
  const queryCache = new QueryCache({
    onError: (error, query) => {
      // check if we should skip handling the error here
      if (query.meta?.skipGlobalErrorHandler) {
        return;
      }

      if (axios.isAxiosError(error) || error instanceof Error) {
        logger.error('Query Error', { error, query });
      }
    },
  });

  const mutationCache = new MutationCache({
    onError: (error, mutation) => {
      if (axios.isAxiosError(error) || error instanceof Error) {
        logger.error('Mutation Error', { error, mutation });
      }
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
