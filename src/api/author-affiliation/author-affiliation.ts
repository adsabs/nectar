import api, { ApiRequestConfig } from '@api/api';
import { ApiTargets } from '@api/models';
import { ADSQuery } from '@api/types';
import { QueryFunction, useQuery } from 'react-query';
import { getAuthorAffiliationSearchParams } from './model';
import { IAuthorAffiliationExportPayload, IAuthorAffiliationPayload, IAuthorAffiliationResponse } from './types';

export const authorAffiliationsKeys = {
  search: (params: IAuthorAffiliationPayload) => ['authoraffiliation/search', params] as const,
  export: (params: IAuthorAffiliationExportPayload) => ['authoraffiliation/export', params] as const,
};

type SearchQuery = ADSQuery<Parameters<typeof authorAffiliationsKeys['search']>[0], IAuthorAffiliationResponse['data']>;
type ExportQuery = ADSQuery<Parameters<typeof authorAffiliationsKeys['export']>[0], string>;

export const useAuthorAffiliationSearch: SearchQuery = (params, options) => {
  const searchParams = getAuthorAffiliationSearchParams(params);
  return useQuery({
    queryKey: authorAffiliationsKeys.search(searchParams),
    queryFn: fetchAuthorAffiliationSearch,
    meta: { params: searchParams },
    ...options,
  });
};

export const useAuthorAffiliationExport: ExportQuery = (params, options) => {
  return useQuery({
    queryKey: authorAffiliationsKeys.export(params),
    queryFn: fetchAuthorAffiliationExport,
    meta: { params },
    ...options,
  });
};

export const fetchAuthorAffiliationSearch: QueryFunction<IAuthorAffiliationResponse['data']> = async ({ meta }) => {
  const { params } = meta as { params: IAuthorAffiliationPayload };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.AUTHOR_AFFILIATION_SEARCH,
    data: params,
  };

  const { data } = await api.request<IAuthorAffiliationResponse>(config);

  return data.data;
};

export const fetchAuthorAffiliationExport: QueryFunction<string> = async ({ meta }) => {
  const { params } = meta as { params: IAuthorAffiliationExportPayload };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.AUTHOR_AFFILIATION_EXPORT,
    data: params,
  };

  const { data } = await api.request<string>(config);

  return data;
};
