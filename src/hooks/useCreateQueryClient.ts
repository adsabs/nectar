import { useToast } from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { QueryCache, QueryClient } from 'react-query';

export const useCreateQueryClient = () => {
  const toast = useToast();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            onError: (error) => {
              console.log('error', error);
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            // check if we should skip handling the error here
            if (query.meta?.skipGlobalErrorHandler) {
              return;
            }

            if (axios.isAxiosError(error) || error instanceof Error) {
              toast({
                title: 'Error',
                description: error.message,
                position: 'bottom',
                status: 'error',
                variant: 'solid',
              });
            }
          },
        }),
      }),
  );

  return queryClient;
};
