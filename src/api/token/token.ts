import api, { ADSQuery, ApiRequestConfig, ApiTargets } from '@api';
import { QueryFunction, useQuery } from '@tanstack/react-query';
import { IADSApiTokenResponse } from './types';

export enum TokenKeys {
  TOKEN = 'token',
}

export const tokenKeys = {
  token: () => TokenKeys.TOKEN,
};

export const useGetToken: ADSQuery<unknown, IADSApiTokenResponse> = (_, options) => {
  return useQuery({
    queryKey: tokenKeys.token(),
    queryFn: fetchToken,
    cacheTime: 0,
    ...options,
  });
};

export const fetchToken: QueryFunction<IADSApiTokenResponse> = async () => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.TOKEN,
  };

  const { data } = await api.request<IADSApiTokenResponse>(config);
  return data;
};
