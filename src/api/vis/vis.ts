import api, { ADSQuery, ApiRequestConfig } from '@api';
import { ApiTargets } from '@api/models';
import { Bibcode } from '@api/search';
import { QueryFunction, useQuery } from 'react-query';
import { getAuthorNetworkParams } from './models';
import { IADSApiVisParams, IADSApiVisResponse } from './types';

const MAX_RETRIES = 3;

export const visKeys = {
  authorNetwork: (params: IADSApiVisParams) => ['vis/authorNetwork', { ...params }] as const,
};

const retryFn = (count: number) => {
  if (count >= MAX_RETRIES) {
    return false;
  }

  return true;
};

export const useGetAuthorNetwork: ADSQuery<Bibcode[], IADSApiVisResponse> = (bibcodes, options) => {
  const authorNetworkParams = getAuthorNetworkParams(bibcodes);

  return useQuery({
    queryKey: visKeys.authorNetwork(authorNetworkParams),
    queryFn: fetchAuthorNetwork,
    retry: retryFn,
    meta: { params: authorNetworkParams },
    ...options,
  });
};

export const fetchAuthorNetwork: QueryFunction<IADSApiVisResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiVisParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_AUTHOR_NETWORK,
    data: params,
  };

  const { data } = await api.request<IADSApiVisResponse>(config);
  return data;
};
