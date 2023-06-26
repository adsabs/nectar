import api, {
  ADSQuery,
  ApiRequestConfig,
  ApiTargets,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  IDocsEntity,
} from '@api';
import { QueryFunction, useQuery } from '@tanstack/react-query';
import { getVaultBigQueryParams } from './models';
import {
  IADSApiUserDataParams,
  IADSApiUserDataResponse,
  IADSApiVaultResponse,
  IADSVaultExecuteQueryParams,
} from './types';

export enum VaultKeys {
  VAULT = 'vault',
  EXECUTE_QUERY = 'vault/execute_query',
  BIGQUERY = 'vault/bigquery',
  SET_USERDATA = 'vault/set-user-data',
  USERDATA = 'vault/user-data',
}

export const vaultKeys = {
  primary: (params: IADSApiSearchParams) => [VaultKeys.VAULT, { params }] as const,
  executeQuery: (qid: IADSVaultExecuteQueryParams['qid']) => [VaultKeys.EXECUTE_QUERY, { qid }] as const,
  bigquery: (bibcodes: IDocsEntity['bibcode'][]) => [VaultKeys.BIGQUERY, { bibcodes }] as const,
  setUserData: (userData: IADSApiUserDataParams) => [VaultKeys.SET_USERDATA, { userData }] as const,
  userData: () => VaultKeys.USERDATA,
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

/** user data request **/
export const useGetUserData: ADSQuery<unknown, IADSApiUserDataResponse> = (_, options) => {
  return useQuery({
    queryKey: vaultKeys.userData(),
    queryFn: fetchUserData,
    ...options,
  });
};

export const fetchUserData: QueryFunction<IADSApiUserDataResponse> = async () => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.USER_DATA,
  };

  const { data } = await api.request<IADSApiUserDataResponse>(config);
  return data;
};

export const useSetUserData: ADSQuery<IADSApiUserDataParams, IADSApiUserDataResponse> = (params, options) => {
  return useQuery({
    queryKey: vaultKeys.setUserData(params),
    queryFn: setUserData,
    meta: { params },
    ...options,
  });
};

export const setUserData: QueryFunction<IADSApiUserDataResponse> = async ({ meta }) => {
  const { params } = meta as { params: Partial<IADSApiUserDataParams> };
  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.USER_DATA,
    data: params,
  };

  const { data } = await api.request<IADSApiUserDataResponse>(config);
  return data;
};
