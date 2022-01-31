import { IADSApiSearchParams, IADSApiSearchResponse, IDocsEntity } from '@api';
import { ApiTargets } from '@api/lib/models';
import { QueryFunction, useQuery, UseQueryOptions, UseQueryResult } from 'react-query';
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

export const responseSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['response'] => data.response;
export const statsSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['stats'] => data.stats;

/**
 * Generic search hook
 */
export const useSearch = (params: IADSApiSearchParams, options?: UseQueryOptions): UseSearchResult => {
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

/**
 * Fetch citations hook
 */
export const useGetCitations = (
  { bibcode, start = 0 }: { bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] },
  options?: UseQueryOptions,
): UseSearchResult => {
  const params = getCitationsParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.citations({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetReferences = (
  { bibcode, start = 0 }: { bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] },
  options?: UseQueryOptions,
): UseSearchResult => {
  const params = getReferencesParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.references({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetCoreads = (
  { bibcode, start = 0 }: { bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] },
  options?: UseQueryOptions,
): UseSearchResult => {
  const params = getCoreadsParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.coreads({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetSimilar = (
  { bibcode, start = 0 }: { bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] },
  options?: UseQueryOptions,
): UseSearchResult => {
  const params = getSimilarParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.similar({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetToc = (
  { bibcode, start = 0 }: { bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] },
  options?: UseQueryOptions,
): UseSearchResult => {
  const params = getTocParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.toc({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetAbstract = ({ id }: { id: string }, options?: UseQueryOptions): UseSearchResult => {
  const params = getAbstractParams(id);
  return useQuery({
    queryKey: searchKeys.abstract(id),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetAbstractPreview = (
  { bibcode }: { bibcode: IDocsEntity['bibcode'] },
  options?: UseQueryOptions,
): UseSearchResult => {
  const params = { ...defaultParams, q: `identifier:"${bibcode}"`, fl: ['abstract'] };
  return useQuery({
    queryKey: searchKeys.preview(bibcode),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetSearchStats = (params: IADSApiSearchParams, options?: UseQueryOptions): UseSearchStatsResult => {
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

export const fetchSearch: QueryFunction<IADSApiSearchResponse> = async ({ meta: { params } }) => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params,
  };
  const { data } = await api.request<IADSApiSearchResponse>(config);
  return data;
};
