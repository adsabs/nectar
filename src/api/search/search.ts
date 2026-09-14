import axios, { AxiosError } from 'axios';
import { omit } from 'ramda';
import {
  MutationFunction,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  defaultParams,
  getAbstractParams,
  getAbstractsParams,
  getAffiliationParams,
  getBigQueryParams,
  getCitationsParams,
  getCoreadsParams,
  getCreditsParams,
  getHighlightParams,
  getMentionsParams,
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
import { APP_DEFAULTS, pickTracingHeaders } from '@/config';
import { isString } from '@/utils/common/guards';
import { RATE_LIMIT_STATUS } from '@/utils/common/parseAPIError';
import { IADSApiSearchParams, IADSApiSearchResponse, IBigQueryMutationParams, IDocsEntity } from '@/api/search/types';
import { ADSMutation, ADSQuery } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';
import { logger } from '@/logger';
import { normalizeFields } from '@/api/search/utils';
import { trackUserFlow, PERF_SPANS } from '@/lib/performance';
import { resolveUiTag, SEARCH_API_KEYS, SearchNamespace } from '@/api/search/ui-tags';

export { SEARCH_API_KEYS, SEARCH_NAMESPACES, UI_TAGS, resolveUiTag } from '@/api/search/ui-tags';
export type { SearchNamespace } from '@/api/search/ui-tags';

type PostTransformer = (data: IADSApiSearchResponse) => IADSApiSearchResponse;

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

type SearchKeyProps = { bibcode: IDocsEntity['bibcode']; start?: number; rows?: number };

export const searchKeys = {
  primary: (params: IADSApiSearchParams, namespace: SearchNamespace = SEARCH_API_KEYS.primary) =>
    [namespace, params] as const,
  highlight: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.highlight, params] as const,
  abstracts: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.abstracts, params] as const,
  preview: (bibcode: IDocsEntity['bibcode'], namespace: SearchNamespace = SEARCH_API_KEYS.preview) =>
    [namespace, { bibcode }] as const,
  abstract: (id: string) => [SEARCH_API_KEYS.abstract, { id }] as const,
  affiliations: ({ bibcode }: SearchKeyProps) => [SEARCH_API_KEYS.affiliations, { bibcode }] as const,
  citations: ({ bibcode, start, rows }: SearchKeyProps) =>
    [SEARCH_API_KEYS.citations, { bibcode, start, rows }] as const,
  references: ({ bibcode, start, rows }: SearchKeyProps) =>
    [SEARCH_API_KEYS.references, { bibcode, start, rows }] as const,
  credits: ({ bibcode, start, rows }: SearchKeyProps) => [SEARCH_API_KEYS.credits, { bibcode, start, rows }] as const,
  mentions: ({ bibcode, start, rows }: SearchKeyProps) => [SEARCH_API_KEYS.mentions, { bibcode, start, rows }] as const,
  coreads: ({ bibcode, start, rows }: SearchKeyProps) => [SEARCH_API_KEYS.coreads, { bibcode, start, rows }] as const,
  similar: ({ bibcode, start, rows }: SearchKeyProps) => [SEARCH_API_KEYS.similar, { bibcode, start, rows }] as const,
  toc: ({ bibcode, start, rows }: SearchKeyProps) => [SEARCH_API_KEYS.toc, { bibcode, start, rows }] as const,
  stats: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.stats, params] as const,
  facet: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.facet, params] as const,
  infinite: (params: IADSApiSearchParams, namespace: SearchNamespace = SEARCH_API_KEYS.infinite) =>
    [namespace, params] as const,
  record: (id: string) => [SEARCH_API_KEYS.record, { id }] as const,
  bigquery: () => [SEARCH_API_KEYS.bigquery] as const,
};

// default params to omit to keep cache entries more concise
const omitParams = (query: IADSApiSearchParams) =>
  omit<IADSApiSearchParams, string>(['fl', 'p'], query) as IADSApiSearchParams;

/**
 * Generic search hook.
 * Default returns the Solr `response` block; override via `options.select`.
 */
export function useSearch<TData = IADSApiSearchResponse['response']>(
  params: IADSApiSearchParams,
  options: Omit<UseQueryOptions<IADSApiSearchResponse, ErrorType, TData>, 'queryKey' | 'queryFn'> & {
    namespace: SearchNamespace;
  },
) {
  const { namespace, ...queryOptions } = options;

  // omit fields from queryKey
  const cleanParams = omitParams(getSearchParams(params));

  // If options.select is provided, use it; otherwise use default
  const select =
    'select' in queryOptions && typeof queryOptions.select === 'function'
      ? queryOptions.select
      : (responseSelector as (d: IADSApiSearchResponse) => TData);

  return useQuery<IADSApiSearchResponse, ErrorType, TData>({
    queryKey: searchKeys.primary(cleanParams, namespace),
    queryHash: JSON.stringify(searchKeys.primary(cleanParams, namespace)),
    queryFn: fetchSearch,
    select,
    // Don't retry 429s: a retry just burns another request against the daily
    // upstream quota and delays the inline rate-limit message.
    retry: (failCount, error) =>
      failCount < 1 &&
      axios.isAxiosError(error) &&
      error.response?.status !== 400 &&
      error.response?.status !== RATE_LIMIT_STATUS,
    ...(queryOptions as Omit<
      UseQueryOptions<IADSApiSearchResponse, ErrorType, TData>,
      'queryKey' | 'queryFn' | 'select'
    >),
    meta: { ...queryOptions.meta, params },
  });
}

type SubPageQuery = SearchADSQuery<{
  bibcode: IDocsEntity['bibcode'];
  start?: IADSApiSearchParams['start'];
  rows?: IADSApiSearchParams['rows'];
}>;

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
    select: highlightingSelector,
    ...options,
    meta: { ...options?.meta, params: highlightParams },
  });
};

/**
 * Bulk-fetch abstracts for all results in a search query
 */
export const useGetAbstracts: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['response']> = (
  params,
  options,
) => {
  const abstractsParams = getAbstractsParams(params);
  return useQuery({
    queryKey: searchKeys.abstracts(omitParams(abstractsParams)),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params: abstractsParams },
  });
};

/**
 * Get citations based on a bibcode and start
 */
export const useGetCitations: SubPageQuery = ({ bibcode, start = 0, rows = APP_DEFAULTS.RESULT_PER_PAGE }, options) => {
  const params = getCitationsParams(bibcode, start, rows);
  return useQuery({
    queryKey: searchKeys.citations({ bibcode, start, rows }),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
  });
};

/**
 * Get references based on a bibcode and start
 */
export const useGetReferences: SubPageQuery = (
  { bibcode, start = 0, rows = APP_DEFAULTS.RESULT_PER_PAGE },
  options,
) => {
  const params = getReferencesParams(bibcode, start, rows);
  return useQuery({
    queryKey: searchKeys.references({ bibcode, start, rows }),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
  });
};

/**
 * Get credits based on a bibcode and start
 */
export const useGetCredits: SubPageQuery = ({ bibcode, start = 0, rows = APP_DEFAULTS.RESULT_PER_PAGE }, options) => {
  const params = getCreditsParams(bibcode, start, rows);
  return useQuery({
    queryKey: searchKeys.credits({ bibcode, start, rows }),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
  });
};

/**
 * Get mentions based on a bibcode and start
 */
export const useGetMentions: SubPageQuery = ({ bibcode, start = 0, rows = APP_DEFAULTS.RESULT_PER_PAGE }, options) => {
  const params = getMentionsParams(bibcode, start, rows);
  return useQuery({
    queryKey: searchKeys.mentions({ bibcode, start, rows }),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
  });
};

/**
 * Get coreads based on a bibcode and start
 */
export const useGetCoreads: SubPageQuery = ({ bibcode, start = 0, rows = APP_DEFAULTS.RESULT_PER_PAGE }, options) => {
  const params = getCoreadsParams(bibcode, start, rows);
  return useQuery({
    queryKey: searchKeys.coreads({ bibcode, start, rows }),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
  });
};

/**
 * Get similar docs based on a bibcode and start
 */
export const useGetSimilar: SubPageQuery = ({ bibcode, start = 0, rows = APP_DEFAULTS.RESULT_PER_PAGE }, options) => {
  const params = getSimilarParams(bibcode, start, rows);
  return useQuery({
    queryKey: searchKeys.similar({ bibcode, start, rows }),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
  });
};

/**
 * Get TOC docs based on a bibcode and start
 */
export const useGetToc: SubPageQuery = ({ bibcode, start = 0, rows = APP_DEFAULTS.RESULT_PER_PAGE }, options) => {
  const params = getTocParams(bibcode, start, rows);
  return useQuery({
    queryKey: searchKeys.toc({ bibcode, start, rows }),
    queryFn: fetchSearch,
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
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
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
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
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
  });
};

/**
 * Get abstract preview based on bibcode
 */
export const useGetAbstractPreview = (
  { bibcode }: { bibcode: IDocsEntity['bibcode'] },
  options?: Omit<
    UseQueryOptions<IADSApiSearchResponse, ErrorType, IADSApiSearchResponse['response']>,
    'queryKey' | 'queryFn'
  > & { namespace?: SearchNamespace },
) => {
  const { namespace = SEARCH_API_KEYS.preview, ...queryOptions } = options ?? {};
  const params = { ...defaultParams, q: `identifier:"${bibcode}"`, fl: ['abstract'] };
  return useQuery({
    queryKey: searchKeys.preview(bibcode, namespace),
    queryHash: JSON.stringify(searchKeys.preview(bibcode, namespace)),
    queryFn: fetchSearch,
    select: responseSelector,
    ...queryOptions,
    meta: { ...queryOptions.meta, params },
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
    select: responseSelector,
    ...options,
    meta: { ...options?.meta, params },
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
    Array.isArray(params.sort) && params.sort.length > 0 && /^citation_count(_norm)?|credit_count/.test(params.sort[0]);

  const searchParams = getSearchStatsParams(
    params,
    params['stats.field'] ? params['stats.field'] : isCitationSort ? params.sort[0] : '',
  );

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  return useQuery({
    queryKey: searchKeys.stats(cleanParams),
    queryFn: fetchSearch,
    enabled: isCitationSort,
    select: statsSelector,
    ...options,
    meta: { ...options?.meta, params: searchParams },
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
    select: facetCountSelector,
    ...options,
    meta: { ...options?.meta, params: searchParams },
  });
};

export const useGetSearchFacet: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse> = (params, options) => {
  const searchParams: IADSApiSearchParams = getSearchFacetParams(params);

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    ...options,
    meta: { ...options?.meta, params: searchParams },
  });
};

export const useGetSearchFacetJSON: SearchADSQuery<
  IADSApiSearchParams & {
    filter?: string[];
    field: string;
  },
  IADSApiSearchResponse['facets']
> = (params, options) => {
  const searchParams: IADSApiSearchParams = getSearchFacetJSONParams(params);

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  // TODO: this should be done in the API, for now this works to filter out unwanted property data
  const transformData = (data: IADSApiSearchResponse) => {
    try {
      if (params?.filter?.length > 0 && data) {
        const buckets = data.facets[params.field].buckets;
        const filtered = buckets.filter((bucket) => {
          return params.filter?.some((filter) => filter === bucket.val);
        });
        return {
          ...data,
          facets: {
            ...data.facets,
            [params.field]: { ...data.facets[params.field], buckets: filtered, numBuckets: filtered.length },
          },
        };
      }
      return data;
    } catch (e) {
      logger.error('Error processing facet data', { error: e });
      return data;
    }
  };

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    select: facetFieldSelector,
    ...options,
    meta: { ...options?.meta, params: searchParams, postTransformers: [transformData] },
  });
};

export const useCustomFacetSearch: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['facets']> = (
  params,
  options,
) => {
  const searchParams: IADSApiSearchParams = getSearchFacetParams(params);

  return useQuery({
    queryKey: searchKeys.facet(searchParams),
    queryFn: fetchSearch,
    select: facetFieldSelector,
    ...options,
    meta: { ...options?.meta, params: searchParams },
  });
};

export const useSearchInfinite = (
  params: IADSApiSearchParams,
  options: Omit<
    UseInfiniteQueryOptions<IADSApiSearchResponse & { pageParam: string }, ErrorType>,
    'queryKey' | 'queryFn'
  > & {
    namespace: SearchNamespace;
  },
) => {
  const { namespace, ...queryOptions } = options;
  return useInfiniteQuery<IADSApiSearchResponse & { pageParam: string }, ErrorType>({
    queryKey: searchKeys.infinite(params, namespace),
    queryFn: fetchSearchInfinite,
    getNextPageParam: (lastPage) => {
      // check if cursormark is same as we sent and that we didn't receive all of them in the first request
      return lastPage.response.numFound > params.rows && lastPage.nextCursorMark !== lastPage.pageParam
        ? lastPage.nextCursorMark
        : false;
    },
    ...queryOptions,
    meta: { ...queryOptions.meta, params },
  });
};

export const useBigQuerySearch: ADSMutation<
  IADSApiSearchResponse['response'],
  IADSApiSearchParams,
  IBigQueryMutationParams['variables']
> = (options) => {
  // No query key on a mutation.
  const params = { ...getBigQueryParams(), ui_tag: SEARCH_API_KEYS.bigquery };
  return useMutation({
    mutationKey: searchKeys.bigquery(),
    mutationFn: ({ bibcodes, rows, sort }) =>
      fetchBigQuerySearch({ params, variables: { bibcodes, rows, sort: sort ?? ['date desc'] } }),
    ...options,
  });
};

export const fetchBigQuerySearch: MutationFunction<
  IADSApiSearchResponse['response'],
  IBigQueryMutationParams
> = async ({ params, variables }: IBigQueryMutationParams) => {
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
export const fetchSearch: QueryFunction<IADSApiSearchResponse> = async ({ queryKey, meta }) => {
  const { params, postTransformers } = meta as {
    params: IADSApiSearchParams;
    postTransformers?: Array<PostTransformer>;
  };
  const uiTag = resolveUiTag(queryKey);

  const finalParams = { ...params };
  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuery({ query: params.q });
    finalParams.q = query;
  }

  // normalize fields in the query
  finalParams.q = normalizeFields(finalParams.q);

  // Untrusted: drop any ui_tag already in the params.
  delete finalParams.ui_tag;
  if (uiTag) {
    finalParams.ui_tag = uiTag;
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: finalParams,
  };

  // Wrap API request in performance span
  const data = await trackUserFlow(PERF_SPANS.SEARCH_QUERY_REQUEST, async () => {
    const response = await api.request<IADSApiSearchResponse>(config);
    return response.data;
  });

  // apply post transformers if any
  if (postTransformers && data) {
    return postTransformers.reduce((acc, transformer) => transformer(acc), data);
  }

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
): Promise<IADSApiSearchResponse> => {
  const finalParams = { ...params };

  const token = ctx.req.session?.token?.access_token;
  if (!token) {
    throw new Error('No Token');
  }

  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuerySSR({ query: params.q }, ctx);
    finalParams.q = query;
  }

  // normalize fields in the query
  finalParams.q = normalizeFields(finalParams.q);

  finalParams.ui_tag = SEARCH_API_KEYS.primary;

  const config: ApiRequestConfig = {
    ...defaultRequestConfig,
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: finalParams,
    headers: {
      ...defaultRequestConfig.headers,
      Authorization: `Bearer ${token}`,
      ...pickTracingHeaders(ctx.req.headers),
    },
  };

  const { data } = await axios.request<IADSApiSearchResponse>(config);
  return data;
};

export const fetchSearchInfinite: QueryFunction<IADSApiSearchResponse & { pageParam: string }> = async ({
  queryKey,
  meta,
  pageParam = '*',
}: QueryFunctionContext<QueryKey, string>) => {
  const { params } = meta as { params: IADSApiSearchParams };
  const uiTag = resolveUiTag(queryKey);

  const finalParams = { ...params };
  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuery({ query: params.q });
    finalParams.q = query;
  }

  // normalize fields in the query
  finalParams.q = normalizeFields(finalParams.q);

  // Untrusted: drop any ui_tag already in the params.
  delete finalParams.ui_tag;
  if (uiTag) {
    finalParams.ui_tag = uiTag;
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
