import { IADSApiSearchParams, IADSApiSearchResponse } from '@api';
import { useSearchInfinite } from '@_api/search';
import { AxiosError } from 'axios';
import { chain } from 'ramda';
import { useEffect, useRef } from 'react';
import { UseInfiniteQueryOptions } from 'react-query';

const DELAY_BETWEEN_REQUESTS = 500;

export interface IUseBatchedSearchProps {
  batches: number;
  transform?: (res: IADSApiSearchResponse) => unknown[];
  intervalDelay?: number;
}

/**
 * Hook to get search results in batches (by rows)
 */
export const useBatchedSearch = (
  params: IADSApiSearchParams & Required<Pick<IADSApiSearchParams, 'q' | 'rows'>>,
  props: IUseBatchedSearchProps,
  options?: UseInfiniteQueryOptions<IADSApiSearchResponse & { pageParam: string }, Error | AxiosError>,
) => {
  const { batches, transform = (res) => res.response.docs, intervalDelay = DELAY_BETWEEN_REQUESTS } = props;

  const { data, isFetchingNextPage, fetchNextPage, fetchPreviousPage, isFetchingPreviousPage, ...rest } =
    useSearchInfinite(params, {
      onSuccess: () => (count.current -= 1),
      ...options,
    });

  const count = useRef(batches);
  useEffect(() => {
    if (count.current === batches) {
      // first run
      void fetchNextPage();
    }

    // internal fetch loop, delay between requests
    if (!isFetchingNextPage && count.current > 0) {
      setTimeout(() => void fetchNextPage(), intervalDelay);
    }
  }, [isFetchingNextPage, batches]);

  // determine if we should notify consumers yet
  if (count.current <= 0) {
    // flatMap over the pages running our transformer
    const docs = chain(transform, data.pages);
    return { data: { docs, numFound: docs.length }, ...rest };
  }

  // if we're not ready yet, data should be undefined
  return { data: undefined, ...rest };
};
