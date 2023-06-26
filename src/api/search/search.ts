import api, {
  ADSQuery,
  ApiRequestConfig,
  ApiTargets,
  getSearchFacetJSONParams,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  IDocsEntity,
  InfiniteADSQuery,
} from '@api';
import { AxiosError } from 'axios';
import { omit } from 'ramda';
import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query';
import { QueryFunction, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { RetryValue } from 'react-query/types/core/retryer';
import {
  defaultParams,
  getAbstractParams,
  getAffiliationParams,
  getCitationsParams,
  getCoreadsParams,
  getHighlightParams,
  getReferencesParams,
  getSearchFacetParams,
  getSearchParams,
  getSearchStatsParams,
  getSimilarParams,
  getTocParams,
} from './models';

type ErrorType = Error | AxiosError;

type SearchADSQuery<P = IADSApiSearchParams, R = IADSApiSearchResponse['response']> = ADSQuery<
  P,
  IADSApiSearchResponse,
  R
>;

export const responseSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['response'] => data.response;
export const statsSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['stats'] => data.stats;
export const facetCountSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['facet_counts'] =>
  data.facet_counts;
export const highlightingSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['highlighting'] =>
  data.highlighting;
export const facetFieldSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['facets'] => data.facets;

const defaultRetryer: RetryValue<ErrorType> = (failCount: number, error): boolean => {
  switch (error.message) {
    case 'Request failed with status code 400':
      return false;
    default:
      return true;
  }
};

type SearchKeyProps =
  | { bibcode: IDocsEntity['bibcode']; start?: number }
  | { bibcode: IDocsEntity['bibcode']; start: number };

export enum SEARCH_API_KEYS {
  primary = 'search/primary',
  preview = 'search/preview',
  infinite = 'search/infinite',
  highlight = 'search/highlight',
}

export const searchKeys = {
  primary: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.primary, params] as const,
  highlight: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.highlight, params] as const,
  preview: (bibcode: IDocsEntity['bibcode']) => ['search/preview', { bibcode }] as const,
  abstract: (id: string) => ['search/abstract', { id }] as const,
  affiliations: ({ bibcode }: SearchKeyProps) => ['search/affiliations', { bibcode }] as const,
  citations: ({ bibcode, start }: SearchKeyProps) => ['search/citations', { bibcode, start }] as const,
  references: ({ bibcode, start }: SearchKeyProps) => ['search/references', { bibcode, start }] as const,
  coreads: ({ bibcode, start }: SearchKeyProps) => ['search/coreads', { bibcode, start }] as const,
  similar: ({ bibcode, start }: SearchKeyProps) => ['search/similar', { bibcode, start }] as const,
  toc: ({ bibcode, start }: SearchKeyProps) => ['search/toc', { bibcode, start }] as const,
  stats: (params: IADSApiSearchParams) => ['search/stats', params] as const,
  facet: (params: IADSApiSearchParams) => ['search/facet', params] as const,
  infinite: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.infinite, params] as const,
};

// default params to omit to keep cache entries more concise
const omitParams = (query: IADSApiSearchParams) =>
  omit<IADSApiSearchParams, string>(['fl', 'p'], query) as IADSApiSearchParams;

/**
 * Generic search hook
 */
export const useSearch: SearchADSQuery = (params, options) => {
  // omit fields from queryKey
  const cleanParams = omitParams(getSearchParams(params));

  return useQuery<IADSApiSearchResponse, ErrorType, IADSApiSearchResponse['response']>({
    queryKey: SEARCH_API_KEYS.primary,
    queryHash: JSON.stringify(searchKeys.primary(cleanParams)),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    retry: defaultRetryer,
    ...options,
  });
};

type SubPageQuery = SearchADSQuery<{ bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] }>;

/**
 * Get highlights based on a search query
 */
export const useGetHighlights: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['highlighting']> = (
  params,
  options,
) => {
  const highlightParams = getHighlightParams(params);
  return useQuery({
    queryKey: searchKeys.highlight(omitParams(highlightParams)),
    queryFn: fetchSearch,
    meta: { params: highlightParams },
    select: highlightingSelector,
    ...options,
  });
};

/**
 * Get citations based on a bibcode and start
 */
export const useGetCitations: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getCitationsParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.citations({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get references based on a bibcode and start
 */
export const useGetReferences: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getReferencesParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.references({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get coreads based on a bibcode and start
 */
export const useGetCoreads: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getCoreadsParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.coreads({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get similar docs based on a bibcode and start
 */
export const useGetSimilar: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getSimilarParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.similar({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get TOC docs based on a bibcode and start
 */
export const useGetToc: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getTocParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.toc({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get abstract based on an id
 */
export const useGetAbstract: SearchADSQuery<{ id: string }> = ({ id }, options) => {
  const params = getAbstractParams(id);
  return useQuery({
    queryKey: searchKeys.abstract(id),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get affiliations based on an id
 */
export const useGetAffiliations: SearchADSQuery<{ bibcode: IDocsEntity['bibcode'] }> = ({ bibcode }, options) => {
  const params = getAffiliationParams(bibcode);
  return useQuery({
    queryKey: searchKeys.affiliations({ bibcode }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get abstract preview based on bibcode
 */
export const useGetAbstractPreview: SearchADSQuery<{ bibcode: IDocsEntity['bibcode'] }> = ({ bibcode }, options) => {
  const params = { ...defaultParams, q: `identifier:"${bibcode}"`, fl: ['abstract'] };
  return useQuery({
    queryKey: SEARCH_API_KEYS.preview,
    queryHash: JSON.stringify(searchKeys.preview(bibcode)),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get search stats based on a solr query
 *
 * *only runs if sort is `citation_count` or `citation_count_norm`*
 */
export const useGetSearchStats: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['stats']> = (
  params,
  options,
) => {
  const isCitationSort =
    Array.isArray(params.sort) && params.sort.length > 0 && /^citation_count(_norm)?/.test(params.sort[0]);

  const searchParams = getSearchStatsParams(
    params,
    params['stats.field'] ? params['stats.field'] : isCitationSort ? params.sort[0] : '',
  );

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  return useQuery({
    queryKey: searchKeys.stats(cleanParams),
    queryFn: fetchSearch,
    meta: { params: searchParams },
    enabled: isCitationSort,
    select: statsSelector,
    ...options,
  });
};

export const useGetSearchFacetCounts: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['facet_counts']> = (
  params,
  options,
) => {
  const searchParams: IADSApiSearchParams = getSearchFacetParams(params);

  // omit fields from queryKey
  const cleanParams = omitParams(searchParams);

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    queryHash: JSON.stringify(cleanParams),
    meta: { params: searchParams },
    select: facetCountSelector,
    ...options,
  });
};

export const useGetSearchFacet: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse> = (params, options) => {
  const searchParams: IADSApiSearchParams = getSearchFacetParams(params);

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    meta: { params: searchParams },
    ...options,
  });
};

export const useGetSearchFacetJSON: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['facets']> = (
  params,
  options,
) => {
  const searchParams: IADSApiSearchParams = getSearchFacetJSONParams(params);

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    meta: { params: searchParams },
    select: facetFieldSelector,
    ...options,
  });
};

export const useSearchInfinite: InfiniteADSQuery<IADSApiSearchParams, IADSApiSearchResponse & { pageParam: string }> = (
  params,
  options,
) => {
  return useInfiniteQuery({
    queryKey: searchKeys.infinite(params),
    queryFn: fetchSearchInfinite,
    getNextPageParam: (lastPage) => {
      // check if cursormark is same as we sent and that we didn't receive all of them in the first request
      return lastPage.response.numFound > params.rows && lastPage.nextCursorMark !== lastPage.pageParam
        ? lastPage.nextCursorMark
        : false;
    },
    meta: { ...options?.meta, params },
    ...options,
  });
};

/**
 * Base fetcher for search
 *
 * *This shouldn't be used directly, except during prefetching*
 */
export const fetchSearch: QueryFunction<IADSApiSearchResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params,
  };
  const { data } = await api.request<IADSApiSearchResponse>(config);
  return data;
};

export const fetchSearchInfinite: QueryFunction<IADSApiSearchResponse & { pageParam: string }> = async ({
  meta,
  pageParam = '*',
}: QueryFunctionContext<QueryKey, string>) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: {
      ...params,
      cursorMark: pageParam,
    } as IADSApiSearchParams,
  };
  const { data } = await api.request<IADSApiSearchResponse>(config);

  return { ...data, pageParam };
};
