import { QueryFunction, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import api, { ApiRequestConfig } from '../api';
import { ExportApiFormatKey, ExportFormatsApiResponse, IExportApiParams, IExportApiResponse } from './types';
import { ADSQuery } from '@/api/types';
import { ApiTargets } from '@/api/models';
import { trackUserFlow, PERF_SPANS } from '@/lib/performance';

export type UseExportCitationResult = UseQueryResult<Partial<IExportApiResponse>>;

export const exportCitationKeys = {
  manifest: () => ['manifest'] as const,
  primary: (params: IExportApiParams) => ['exportcitation', { params }] as const,
};

export const useGetExportFormats = (options?: UseQueryOptions<ExportFormatsApiResponse>) => {
  return useQuery({
    queryKey: exportCitationKeys.manifest(),
    queryFn: fetchExportFormats,
    ...options,
  });
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

export const fetchExportFormats: QueryFunction<ExportFormatsApiResponse> = async () => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.EXPORT_MANIFEST,
  };

  const { data } = await api.request<ExportFormatsApiResponse>(config);

  return data;
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

  return trackUserFlow(PERF_SPANS.EXPORT_API_REQUEST, async () => {
    const { data } = await api.request<IExportApiResponse>(config);
    return data;
  });
};
