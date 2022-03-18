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
            if (axios.isAxiosError(error) || error instanceof Error) {
              toast({
                title: 'Error',
                description: error.message,
                position: 'bottom',
                status: 'error',
                variant: 'solid',
              });
            }
            console.log('error', error, query);
          },
        }),
      }),
  );

  return queryClient;
};
