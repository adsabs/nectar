import axios, { AxiosError } from 'axios';
import { omit, pick } from 'ramda';
import {
  MutationFunction,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import {
  defaultParams,
  getAbstractParams,
  getAffiliationParams,
  getBigQueryParams,
  getCitationsParams,
  getCoreadsParams,
  getHighlightParams,
  getReferencesParams,
  getSearchFacetJSONParams,
  getSearchFacetParams,
  getSearchParams,
  getSearchStatsParams,
  getSimilarParams,
  getSingleRecordParams,
  getTocParams,
} from './models';
import { resolveObjectQuery, resolveObjectQuerySSR } from '@/api/objects/objects';
import { GetServerSidePropsContext } from 'next';
import { defaultRequestConfig } from '../config';
import { TRACING_HEADERS } from '@/config';
import { isString } from '@/utils/common/guards';
import { IADSApiSearchParams, IADSApiSearchResponse, IBigQueryMutationParams, IDocsEntity } from '@/api/search/types';
import { ADSMutation, ADSQuery, InfiniteADSQuery } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

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
export const highlightingSelector = (
  data: IADSApiSearchResponse,
): { docs: IADSApiSearchResponse['response']['docs']; highlighting: IADSApiSearchResponse['highlighting'] } => ({
  docs: data.response.docs,
  highlighting: data.highlighting,
});
export const facetFieldSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['facets'] => data.facets;

type SearchKeyProps =
  | { bibcode: IDocsEntity['bibcode']; start?: number }
  | { bibcode: IDocsEntity['bibcode']; start: number };

export enum SEARCH_API_KEYS {
  primary = 'search/primary',
  preview = 'search/preview',
  infinite = 'search/infinite',
  highlight = 'search/highlight',
  bigquery = 'search/bigquery',
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
  record: (id: string) => ['search/record', { id }] as const,
  bigquery: () => [SEARCH_API_KEYS.bigquery] as const,
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
    queryKey: searchKeys.primary(cleanParams),
    queryHash: JSON.stringify(searchKeys.primary(cleanParams)),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    retry: (failCount, error): boolean => {
      return failCount < 1 && axios.isAxiosError(error) && error.response?.status !== 400;
    },
    ...options,
  });
};

type SubPageQuery = SearchADSQuery<{ bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] }>;

/**
 * Get highlights based on a search query
 */
export const useGetHighlights: SearchADSQuery<
  IADSApiSearchParams,
  { docs: IADSApiSearchResponse['response']['docs']; highlighting: IADSApiSearchResponse['highlighting'] }
> = (params, options) => {
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
    queryKey: searchKeys.preview(bibcode),
    queryHash: JSON.stringify(searchKeys.preview(bibcode)),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get a single record using identifier for feedack form
 */
export const useGetSingleRecord: SearchADSQuery<{ id: string }> = ({ id }, options) => {
  const params = getSingleRecordParams(id);
  return useQuery({
    queryKey: searchKeys.record(id),
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

export const useBigQuerySearch: ADSMutation<
  IADSApiSearchResponse['response'],
  IADSApiSearchParams,
  IBigQueryMutationParams['variables']
> = (options) => {
  const params = getBigQueryParams();
  return useMutation({
    mutationKey: searchKeys.bigquery(),
    mutationFn: ({ bibcodes, rows, sort }) =>
      fetchBigQuerySearch({ params, variables: { bibcodes, rows, sort: sort ?? ['date desc'] } }),
    ...options,
  });
};

export const fetchBigQuerySearch: MutationFunction<IADSApiSearchResponse['response'], IBigQueryMutationParams> =
  async ({ params, variables }: IBigQueryMutationParams) => {
    const config: ApiRequestConfig = {
      method: 'POST',
      url: `${ApiTargets.BIGQUERY}`,
      params: { ...params, rows: variables.rows, sort: variables.sort },
      data: `bibcode\n${variables.bibcodes.join('\n')}`,
      headers: { 'Content-Type': 'bigquery/csv' },
    };

    const { data } = await api.request<IADSApiSearchResponse>(config);
    return data.response;
  };

/**
 * Fetches search results from the API based on provided search parameters.
 *
 * @function
 * @param {Object} options - The function options.
 * @param {Object} options.meta - Metadata for the search query.
 * @param {Object} options.meta.params - The search parameters to be used in the query.
 *
 * @returns {Promise<IADSApiSearchResponse>} - A promise that resolves to the search response data.
 */
export const fetchSearch: QueryFunction<IADSApiSearchResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const finalParams = { ...params };
  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuery({ query: params.q });
    finalParams.q = query;
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: finalParams,
  };
  const { data } = await api.request<IADSApiSearchResponse>(config);
  return data;
};

/**
 * Fetches search results on the server side.
 *
 * This function performs a search request using the provided parameters and server-side context.
 * It handles token validation and query string resolution when necessary.
 * The search request is sent to the specified API target with appropriate headers and configurations.
 *
 * @param {IADSApiSearchParams} params - The parameters for the search request.
 * @param {GetServerSidePropsContext} ctx - The server-side context that includes request and session information.
 * @param {QueryFunctionContext} qfCtx - The query function context that provides cancellation signal.
 * @returns {Promise<IADSApiSearchResponse>} - A promise that resolves to the search response data.
 * @throws {Error} - Throws an error if the token is not available.
 */
export const fetchSearchSSR = async (
  params: IADSApiSearchParams,
  ctx: GetServerSidePropsContext,
  {}: QueryFunctionContext,
) => {
  const finalParams = { ...params };

  const token = ctx.req.session?.token?.access_token;
  if (!token) {
    throw new Error('No Token');
  }

  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuerySSR({ query: params.q }, ctx);
    finalParams.q = query;
  }

  const config: ApiRequestConfig = {
    ...defaultRequestConfig,
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: finalParams,
    headers: {
      Authorization: `Bearer ${token}`,
      ...pick(TRACING_HEADERS, ctx.req.headers),
    },
  };

  const { data } = await axios.request<IADSApiSearchResponse>(config);
  return data;
};

export const fetchSearchInfinite: QueryFunction<IADSApiSearchResponse & { pageParam: string }> = async ({
  meta,
  pageParam = '*',
}: QueryFunctionContext<QueryKey, string>) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const finalParams = { ...params };
  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuery({ query: params.q });
    finalParams.q = query;
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: {
      ...finalParams,
      cursorMark: pageParam,
    } as IADSApiSearchParams,
  };
  const { data } = await api.request<IADSApiSearchResponse>(config);

  return { ...data, pageParam };
};
