import { ApiTargets } from '@api/lib/models';
import { ADSQuery } from '@_api/types';
import { QueryFunction, useQuery, UseQueryResult } from 'react-query';
import api, { ApiRequestConfig } from '../api';
import { IExportApiParams, IExportApiResponse } from './types';

export type UseExportCitationResult = UseQueryResult<Partial<IExportApiResponse>>;

export const exportCitationKeys = {
  primary: (params: IExportApiParams) => ['exportcitation', { params }] as const,
};

/**
 * Get exports based on bibcode(s)
 */
export const useGetExportCitation: ADSQuery<IExportApiParams, IExportApiResponse> = (params, options) => {
  return useQuery({
    queryKey: exportCitationKeys.primary(params),
    queryFn: fetchExportCitation,
    meta: { params },
    ...options,
  });
};

export const fetchExportCitation: QueryFunction<IExportApiResponse> = async ({ meta }) => {
  const { params } = meta as { params: IExportApiParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.EXPORT}/${params.format}`,
    data: {
      ...params,
      format: params.customFormat,
    },
  };

  const { data } = await api.request<IExportApiResponse>(config);

  return data;
};
