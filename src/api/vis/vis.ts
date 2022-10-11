import api, { ADSQuery, ApiRequestConfig } from '@api';
import { ApiTargets } from '@api/models';
import { IADSApiSearchParams } from '@api/search';
import { QueryFunction, useQuery } from 'react-query';
import { getAuthorNetworkParams, getPaperNetworkParams } from './models';
import { IADSApiAuthorNetworkResponse, IADSApiPaperNetworkResponse, IADSApiVisParams } from './types';

const MAX_RETRIES = 3;

export const visKeys = {
  authorNetwork: (params: IADSApiVisParams) => ['vis/authorNetwork', { ...params }] as const,
  paperNetwork: (params: IADSApiVisParams) => ['vis/paperNetwork', { ...params }] as const,
};

const retryFn = (count: number) => {
  if (count >= MAX_RETRIES) {
    return false;
  }

  return true;
};

export const useGetAuthorNetwork: ADSQuery<IADSApiSearchParams, IADSApiAuthorNetworkResponse> = (params, options) => {
  const authorNetworkParams = getAuthorNetworkParams(params);

  return useQuery({
    queryKey: visKeys.authorNetwork(authorNetworkParams),
    queryFn: fetchAuthorNetwork,
    retry: retryFn,
    meta: { params: authorNetworkParams },
    ...options,
  });
};

export const fetchAuthorNetwork: QueryFunction<IADSApiAuthorNetworkResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiVisParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_AUTHOR_NETWORK,
    data: params,
  };

  const { data } = await api.request<IADSApiAuthorNetworkResponse>(config);
  return data;
};

export const useGetPaperNetwork: ADSQuery<IADSApiSearchParams, IADSApiPaperNetworkResponse> = (params, options) => {
  const paperNetworkParams = getPaperNetworkParams(params);

  return useQuery({
    queryKey: visKeys.paperNetwork(paperNetworkParams),
    queryFn: fetchPaperNetwork,
    retry: retryFn,
    meta: { params: paperNetworkParams },
    ...options,
  });
};

export const fetchPaperNetwork: QueryFunction<IADSApiPaperNetworkResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiVisParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_PAPER_NETWORK,
    data: params,
  };

  const { data } = await api.request<IADSApiPaperNetworkResponse>(config);
  return data;
};
