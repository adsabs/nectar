import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity } from '@api';
import { ApiTargets } from '@api/lib/models';
import { ADSQuery } from '@_api/types';
import { QueryFunction, useQuery, UseQueryResult } from 'react-query';
import api, { ApiRequestConfig } from '../api';
import {
  defaultParams,
  getAbstractParams,
  getCitationsParams,
  getCoreadsParams,
  getReferencesParams,
  getSearchStatsParams,
  getSimilarParams,
  getTocParams,
} from './models';

export type UseSearchResult = UseQueryResult<Partial<IADSApiSearchResponse['response']>>;
export type UseSearchStatsResult = UseQueryResult<Partial<IADSApiSearchResponse['stats']>>;

export const responseSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['response'] => data.response;
export const statsSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['stats'] => data.stats;

export const searchKeys = {
  primary: (params: IADSApiSearchParams) => ['search', params] as const,
  preview: (bibcode: IDocsEntity['bibcode']) => ['search/preview', { bibcode }] as const,
  abstract: (id: string) => ['search/abstract', { id }] as const,
  citations: ({ bibcode, start }: { bibcode: IDocsEntity['bibcode']; start: number }) =>
    ['search/citations', { bibcode, start }] as const,
  references: ({ bibcode, start }: { bibcode: IDocsEntity['bibcode']; start: number }) =>
    ['search/references', { bibcode, start }] as const,
  coreads: ({ bibcode, start }: { bibcode: IDocsEntity['bibcode']; start: number }) =>
    ['search/coreads', { bibcode, start }] as const,
  similar: ({ bibcode, start }: { bibcode: IDocsEntity['bibcode']; start: number }) =>
    ['search/similar', { bibcode, start }] as const,
  toc: ({ bibcode, start }: { bibcode: IDocsEntity['bibcode']; start: number }) =>
    ['search/toc', { bibcode, start }] as const,
  stats: (params: IADSApiSearchParams) => ['search/stats', params] as const,
};

/**
 * Generic search hook
 */
export const useSearch: ADSQuery<IADSApiSearchParams, UseSearchResult> = (params, options) => {
  // omit fields from queryKey
  const { fl, ...cleanParams } = params;
  return useQuery({
    queryKey: searchKeys.primary(cleanParams),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

type SubpageParams = { bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] };
type SubPageQuery = ADSQuery<SubpageParams, UseSearchResult>;

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
export const useGetAbstract: ADSQuery<{ id: string }, UseSearchResult> = ({ id }, options) => {
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
 * Get abstract preview based on bibcode
 */
export const useGetAbstractPreview: ADSQuery<{ bibcode: IDocsEntity['bibcode'] }, UseSearchResult> = (
  { bibcode },
  options,
) => {
  const params = { ...defaultParams, q: `identifier:"${bibcode}"`, fl: ['abstract'] };
  return useQuery({
    queryKey: searchKeys.preview(bibcode),
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
export const useGetSearchStats: ADSQuery<IADSApiSearchParams, UseSearchStatsResult> = (params, options) => {
  const isCitationSort =
    Array.isArray(params.sort) && params.sort.length > 0 && /^citation_count(_norm)?/.test(params.sort[0]);

  const searchParams: IADSApiSearchParams = getSearchStatsParams(params, isCitationSort ? params.sort[0] : '');

  // omit fields from queryKey
  const { fl, ...cleanParams } = params;

  return useQuery({
    queryKey: searchKeys.stats(cleanParams),
    queryFn: fetchSearch,
    meta: { params: searchParams },
    enabled: isCitationSort,
    select: statsSelector,
    ...options,
  });
};

/**
 * Base fetcher for search
 *
 * *This shouldn't be used directly, except during prefetching*
 */
export const fetchSearch: QueryFunction<IADSApiSearchResponse> = async ({ meta: { params } }) => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params,
  };
  const { data } = await api.request<IADSApiSearchResponse>(config);
  return data;
};
