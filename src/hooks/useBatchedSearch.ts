import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity, useSearchInfinite } from '@api';
import { AxiosError } from 'axios';
import { chain } from 'ramda';
import { useEffect, useState } from 'react';
import { UseInfiniteQueryOptions } from 'react-query';

const DELAY_BETWEEN_REQUESTS = 500;

export interface IUseBatchedSearchProps<T> {
  batches: number;
  transformResponses?: (res: IADSApiSearchResponse & { pageParam: string }) => T[];
  intervalDelay?: number;
}

const defaultTransformer: IUseBatchedSearchProps<IDocsEntity>['transformResponses'] = (res) => res.response.docs;

/**
 * Hook to get search results in batches (by rows)
 */
export const useBatchedSearch = <T = unknown>(
  params: IADSApiSearchParams & Required<Pick<IADSApiSearchParams, 'q' | 'rows'>>,
  props: IUseBatchedSearchProps<T>,
  options?: UseInfiniteQueryOptions<IADSApiSearchResponse & { pageParam: string }, Error | AxiosError>,
) => {
  const { batches, transformResponses = defaultTransformer, intervalDelay = DELAY_BETWEEN_REQUESTS } = props;
  const [count, setCount] = useState(() => batches);
  const [isPending, setIsPending] = useState(false);

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, status, ...rest } = useSearchInfinite(params, {
    ...options,
    enabled: count > 0,
  });

  // watch data for changes, and update state
  useEffect(() => {
    if (data) {
      setCount(count - 1);
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
