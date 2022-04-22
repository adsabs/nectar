import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity } from '@api';
import { useSearchInfinite } from '@_api/search';
import { AxiosError } from 'axios';
import { chain } from 'ramda';
import { useEffect, useRef } from 'react';
import { UseInfiniteQueryOptions } from 'react-query';

const DELAY_BETWEEN_REQUESTS = 500;

export interface IUseBatchedSearchProps {
  batches: number;
  transformPagesToDocs?: (res: IADSApiSearchResponse & { pageParam: string }) => IDocsEntity[];
  intervalDelay?: number;
}

const defaultTransformer: IUseBatchedSearchProps['transformPagesToDocs'] = (res) => res.response.docs;

/**
 * Hook to get search results in batches (by rows)
 */
export const useBatchedSearch = (
  params: IADSApiSearchParams & Required<Pick<IADSApiSearchParams, 'q' | 'rows'>>,
  props: IUseBatchedSearchProps,
  options?: UseInfiniteQueryOptions<IADSApiSearchResponse & { pageParam: string }, Error | AxiosError>,
) => {
  const { batches, transformPagesToDocs = defaultTransformer, intervalDelay = DELAY_BETWEEN_REQUESTS } = props;

  const count = useRef(batches);
  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, status, ...rest } = useSearchInfinite(params, {
    ...options,
    onSuccess: (data) => {
      // decrement count, this will trigger the next fetch
      count.current -= 1;
      typeof options?.onSuccess === 'function' ? options.onSuccess(data) : false;
    },
  });

  useEffect(() => {
    // run initial fetch on mount
    void fetchNextPage();
  }, []);

  useEffect(() => {
    // internal fetch loop, delay between requests
    if (count.current > 0) {
      setTimeout(() => void fetchNextPage(), intervalDelay);
    }
  }, [count.current]);

  // determine if we should notify consumers yet
  if (count.current <= 0) {
    // flatMap over the pages running our transformer
    const docs = chain(transformPagesToDocs, data.pages);
    return { data: { docs, numFound: docs.length }, isFetchingNextPage, fetchNextPage, ...rest };
  }

  // if we're not ready yet, data should be undefined
  return { data: undefined, isFetchingNextPage, fetchNextPage, ...rest };
};
