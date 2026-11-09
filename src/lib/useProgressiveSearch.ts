import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { getSearchParams } from '@/api/search/models';
import { omitParams, SEARCH_API_KEYS, useSearch } from '@/api/search/search';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { PRIMER_ROWS } from '@/config';

export const REVEAL_CHUNK_SIZE = 25;

const identity = (data: IADSApiSearchResponse): IADSApiSearchResponse => data;

const pickBestResponse = (
  primerData: IADSApiSearchResponse | undefined,
  fullData: IADSApiSearchResponse | undefined,
): IADSApiSearchResponse | undefined => {
  const candidates = [primerData, fullData].filter(
    (response): response is IADSApiSearchResponse => response !== undefined,
  );
  return candidates.reduce<IADSApiSearchResponse | undefined>((best, candidate) => {
    if (!best || candidate.response.docs.length > best.response.docs.length) {
      return candidate;
    }
    return best;
  }, undefined);
};

const useStagedSearch = (params: IADSApiSearchParams) => {
  const isLargePage = (params.rows ?? 0) > PRIMER_ROWS;
  const primerParams = isLargePage ? { ...params, rows: PRIMER_ROWS } : params;
  const primerNamespace = isLargePage ? SEARCH_API_KEYS.primaryPrimer : SEARCH_API_KEYS.primary;

  const primer = useSearch<IADSApiSearchResponse>(primerParams, {
    namespace: primerNamespace,
    select: identity,
  });

  const primerCoversAll = primer.data !== undefined && primer.data.response.docs.length < PRIMER_ROWS;

  const full = useSearch<IADSApiSearchResponse>(params, {
    namespace: SEARCH_API_KEYS.primary,
    select: identity,
    enabled: isLargePage && primer.isSuccess && !primerCoversAll,
  });

  const bestResponse = useMemo(() => pickBestResponse(primer.data, full.data), [primer.data, full.data]);

  return {
    bestResponse,
    isFinalStageReady: !isLargePage || primerCoversAll || full.isSuccess,
    isLoading: primer.isLoading,
    isFetching: primer.isFetching,
    isSuccess: primer.isSuccess,
    isError: primer.isError,
    error: primer.error,
    isFillError: isLargePage && !primerCoversAll && full.isError,
    fillError: isLargePage && !primerCoversAll ? full.error : null,
    isFillFetching: isLargePage && !primerCoversAll && full.isFetching,
    refetch: primer.refetch,
    refetchFill: full.refetch,
  };
};

export const useChunkedReveal = (availableCount: number, resetKey: string): number => {
  const [revealedCount, setRevealedCount] = useState(0);
  const availableCountRef = useRef(availableCount);
  availableCountRef.current = availableCount;

  const [renderedKey, setRenderedKey] = useState(resetKey);
  const isNewResultSet = renderedKey !== resetKey;
  if (isNewResultSet) {
    setRenderedKey(resetKey);
    setRevealedCount(0);
  }
  const currentRevealedCount = isNewResultSet ? 0 : revealedCount;

  useEffect(() => {
    const handleBeforePrint = () => {
      flushSync(() => {
        setRevealedCount(availableCountRef.current);
      });
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  useEffect(() => {
    if (currentRevealedCount >= availableCount) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setRevealedCount((count) => Math.min(count + REVEAL_CHUNK_SIZE, availableCount));
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [currentRevealedCount, availableCount]);

  return currentRevealedCount;
};

export const useProgressiveSearch = (params: IADSApiSearchParams) => {
  const staged = useStagedSearch(params);
  const availableCount = staged.bestResponse?.response.docs.length ?? 0;
  const resetKey = JSON.stringify(omitParams(getSearchParams(params)));
  const revealedCount = useChunkedReveal(availableCount, resetKey);

  const docs = useMemo(
    () => staged.bestResponse?.response.docs.slice(0, revealedCount) ?? [],
    [staged.bestResponse, revealedCount],
  );

  return {
    data: staged.bestResponse,
    docs,
    isLoading: staged.isLoading,
    isFetching: staged.isFetching,
    isSuccess: staged.isSuccess,
    isError: staged.isError,
    error: staged.error,
    isFillError: staged.isFillError,
    fillError: staged.fillError,
    isFillFetching: staged.isFillFetching,
    isFullSetLoaded: staged.isFinalStageReady,
    refetch: staged.refetch,
    refetchFill: staged.refetchFill,
    resultSetKey: resetKey,
    pageRowCount: staged.bestResponse ? Math.min(params.rows ?? 0, staged.bestResponse.response.numFound) : 0,
  };
};
