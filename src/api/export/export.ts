import { ADSQuery, ApiTargets } from '@api';
import { QueryFunction, useQuery, UseQueryResult } from '@tanstack/react-query';
import api, { ApiRequestConfig } from '../api';
import { ExportApiFormatKey, IExportApiParams, IExportApiResponse } from './types';

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
  const {
    params: { customFormat, format, ...params },
  } = meta as { params: IExportApiParams };

  // custom format is "format" if format === 'custom'
  // otherwise "format" isn't passed, so we strip them here and do that logic

  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.EXPORT}/${format}`,
    data: {
      ...params,
      ...(format === ExportApiFormatKey.custom ? { format: customFormat } : {}),
    },
  };

  const { data } = await api.request<IExportApiResponse>(config);

  return data;
};
