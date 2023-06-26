import axios from 'axios';
import { useState } from 'react';
import { QueryCache, QueryClient } from '@tanstack/react-query';

export const useCreateQueryClient = () => {
  const queryCache = new QueryCache({
    onError: (error, query) => {
      // check if we should skip handling the error here
      if (query.meta?.skipGlobalErrorHandler) {
        return;
      }

      if (axios.isAxiosError(error) || error instanceof Error) {
        // TODO: global error, what should be done here?
      }
    },
  });

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            notifyOnChangeProps: 'tracked',
          },
        },
        queryCache,
      }),
  );

  return queryClient;
};
