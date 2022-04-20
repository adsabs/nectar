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
          onError: (error) => {
            if (
              (axios.isAxiosError(error) || error instanceof Error) &&
              !error.message.startsWith('No database entry') && // no graphics
              !error.message.startsWith('No data available') // no metrics
            ) {
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
