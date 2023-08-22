import api, {
  ADSQuery,
  ApiRequestConfig,
  ApiTargets,
  IADSApiLibraryLinkServersResponse,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  IDocsEntity,
} from '@api';
import { QueryFunction, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getVaultBigQueryParams } from './models';
import { IADSApiVaultResponse, IADSVaultExecuteQueryParams } from './types';

export enum VaultKeys {
  VAULT = 'vault',
  EXECUTE_QUERY = 'vault/execute_query',
  BIGQUERY = 'vault/bigquery',
  LIBRARY_LINK_SERVERS = 'vault/library_link_servers',
}

export const vaultKeys = {
  primary: (params: IADSApiSearchParams) => [VaultKeys.VAULT, { params }] as const,
  executeQuery: (qid: IADSVaultExecuteQueryParams['qid']) => [VaultKeys.EXECUTE_QUERY, { qid }] as const,
  bigquery: (bibcodes: IDocsEntity['bibcode'][]) => [VaultKeys.BIGQUERY, { bibcodes }] as const,
  libraryLinkServers: () => [VaultKeys.LIBRARY_LINK_SERVERS] as const,
};

/**
 * Generic search, allows for any solr query params
 * Vault will save this query and return a QID for use in other searches/filters/etc.
 */
export const useVaultSearch: ADSQuery<IADSApiSearchParams, IADSApiVaultResponse> = (params, options) => {
  return useQuery({
    queryKey: vaultKeys.primary(params),
    queryFn: fetchVaultSearch,
    meta: { params },
    ...options,
  });
};

/**
 * Request to vault to retreive the cached query by QID
 */
export const useVaultExecuteQuery: ADSQuery<IADSVaultExecuteQueryParams, IADSApiVaultResponse> = ({ qid }, options) => {
  const params = { qid };
  return useQuery({
    queryKey: vaultKeys.executeQuery(qid),
    queryFn: fetchVaultSearch,
    meta: { params },
    ...options,
  });
};

/**
 * Request to vault to save a bigquery search (for set of bibcodes) with sensible defaults
 */
export const useVaultBigQuerySearch: ADSQuery<IDocsEntity['bibcode'][], IADSApiVaultResponse> = (bibcodes, options) => {
  const params = getVaultBigQueryParams(bibcodes);
  return useQuery({
    queryKey: vaultKeys.bigquery(bibcodes),
    queryFn: fetchVaultSearch,
    meta: { params },
    ...options,
  });
};

export const fetchVaultSearch: QueryFunction<IADSApiVaultResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.MYADS_STORAGE}/query`,
    data: params,
  };

  const { data } = await api.request<IADSApiVaultResponse>(config);
  return data;
};

export const fetchVaultExecuteQuery: QueryFunction<IADSApiSearchResponse['response']> = async ({ meta }) => {
  const { params } = meta as { params: IADSVaultExecuteQueryParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.MYADS_STORAGE}/execute_query/${params.qid}`,
  };

  const { data } = await api.request<IADSApiSearchResponse['response']>(config);
  return data;
};

export const fetchLibraryLinkServers: QueryFunction<IADSApiLibraryLinkServersResponse> = async () => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.LINK_SERVERS,
  };

  const { data } = await api.request<IADSApiLibraryLinkServersResponse>(config);
  return data;
};

export const useLibraryLinkServers = (options?: UseQueryOptions<IADSApiLibraryLinkServersResponse>) => {
  return useQuery({
    queryKey: vaultKeys.libraryLinkServers(),
    queryFn: fetchLibraryLinkServers,
    ...options,
  });
};
