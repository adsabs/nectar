import { QueryFunction, useQuery } from '@tanstack/react-query';
import api, { ApiRequestConfig } from '../api';
import { ApiTargets } from '../models';
import { ADSQuery } from '../types';
import { ICitationHelperParams, ICitationHelperResponse } from './types';

export const citationHelperKeys = {
  search: (params: ICitationHelperParams) => ['citationhelper', params] as const,
};

export const useCitationHelper: ADSQuery<ICitationHelperParams, ICitationHelperResponse> = (params, options) => {
  return useQuery({
    queryKey: citationHelperKeys.search(params),
    queryFn: fetchCitationHelper,
    meta: { params },
    ...options,
  });
};

export const fetchCitationHelper: QueryFunction<ICitationHelperResponse> = async ({ meta }) => {
  const { params } = meta as { params: ICitationHelperParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_CITATION_HELPER,
    data: params,
  };

  const { data } = await api.request<ICitationHelperResponse>(config);

  return data;
};
