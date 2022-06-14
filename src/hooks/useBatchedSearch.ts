import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity, searchKeys, useSearchInfinite } from '@api';
import { AxiosError } from 'axios';
import { chain } from 'ramda';
import { useEffect, useState } from 'react';
import { InfiniteData, UseInfiniteQueryOptions, useQueryClient } from 'react-query';

const DELAY_BETWEEN_REQUESTS = 500;

export interface IUseBatchedSearchProps<T> {
  batches: number;
  transformResponses?: (res: IADSApiSearchResponse & { pageParam: string }) => T[];
  intervalDelay?: number;
}

const defaultTransformer: IUseBatchedSearchProps<IDocsEntity>['transformResponses'] = (res) => res.response.docs;

/**
 * Hook to get search results in batches (by rows)
 *
 * TODO: number of batches could be updated after the first request when we know the number of total records
 */
export const useBatchedSearch = <T = unknown>(
  params: IADSApiSearchParams & Required<Pick<IADSApiSearchParams, 'q' | 'rows'>>,
  props: IUseBatchedSearchProps<T>,
  options?: UseInfiniteQueryOptions<IADSApiSearchResponse & { pageParam: string }, Error | AxiosError>,
) => {
  const { batches, transformResponses = defaultTransformer, intervalDelay = DELAY_BETWEEN_REQUESTS } = props;
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const [count, setCount] = useState(() => {
    // check cache on mount to see if we find any data
    const cachedSearchTuple = queryClient.getQueryData<
      InfiniteData<
        IADSApiSearchResponse & {
          pageParam: string;
        }
      >
    >(searchKeys.infinite(params));

    // if found then set our count with the updated value,
    // otherwise the page will continue from where it left off
    if (cachedSearchTuple) {
      return batches - cachedSearchTuple.pages.length;
    }

    return batches;
  });

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, status, ...rest } = useSearchInfinite(params, {
    ...options,
    keepPreviousData: true,
    enabled: count > 0,
  });

  // watch data for changes, and update state
  useEffect(() => {
    if (data) {
      // decrement count
      setCount((count) => count - 1);
      setIsPending(false);
    }
  }, [data]);

  // check pending and count to confirm we should fetch next page
  useEffect(() => {
    if (!isPending && count > 0 && hasNextPage && !isFetchingNextPage) {
      setTimeout(() => void fetchNextPage(), intervalDelay);
      setIsPending(true);
    }
  }, [count, hasNextPage, isFetchingNextPage, isPending]);

  // determine if we should notify consumers yet
  if ((count <= 0 || !hasNextPage) && data) {
    // flatMap over the pages running our transformer
    const docs = chain(transformResponses, data.pages) as T[];
    return { data: { docs, numFound: docs.length }, isFetchingNextPage, fetchNextPage, progress: 100, ...rest };
  }

  // if we're not ready yet, data should be undefined
  return { data: undefined, isFetchingNextPage, fetchNextPage, progress: ((batches - count) / batches) * 100, ...rest };
};
