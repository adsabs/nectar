import api, {
  ADSQuery,
  ApiRequestConfig,
  ApiTargets,
  BasicStatsKey,
  Bibcode,
  CitationsStatsKey,
  IADSApiMetricsParams,
  MetricsResponseKey,
} from '@api';
import { isNil } from 'ramda';
import { QueryFunction, useQuery } from '@tanstack/react-query';
import { getMetricsParams, getMetricsTimeSeriesParams } from './model';
import { IADSApiMetricsResponse } from './types';

const MAX_RETRIES = 3;

export const metricsKeys = {
  primary: (bibcodes: Bibcode[]) => ['metrics', { bibcodes }] as const,
  timeSeries: (bibcodes: Bibcode[]) => ['metrics/timeSeries', { bibcodes }] as const,
};

const retryFn = (count: number, error: unknown) => {
  if (count >= MAX_RETRIES || (error instanceof Error && error.message.startsWith('No data available'))) {
    return false;
  }

  return true;
};

/**
 * Fetches metrics and checks if citations and reads exist
 */
export const useHasMetrics: ADSQuery<Bibcode, IADSApiMetricsResponse, null, boolean> = (bibcode, options) => {
  const params = getMetricsParams([bibcode]);

  const { data, isError } = useQuery({
    queryKey: metricsKeys.primary([bibcode]),
    queryFn: fetchMetrics,
    retry: retryFn,
    meta: { params, skipGlobalErrorHandler: true },
    ...options,
  });

  const metrics = data as IADSApiMetricsResponse;

  if (isError) {
    return false;
  }

  try {
    const hasCitations = metrics[MetricsResponseKey.CS][CitationsStatsKey.TNC] > 0;
    const hasReads = metrics[MetricsResponseKey.BS][BasicStatsKey.TNR] > 0;

    return hasCitations || hasReads;
  } catch (e) {
    return false;
  }
};

/**
 * Get metrics based on bibcode
 */
export const useGetMetrics: ADSQuery<Bibcode | Bibcode[], IADSApiMetricsResponse> = (bibcode, options) => {
  const bibcodes = Array.isArray(bibcode) ? bibcode : [bibcode];
  const params = getMetricsParams(bibcodes);

  return useQuery({
    queryKey: metricsKeys.primary(bibcodes),
    queryFn: fetchMetrics,
    retry: retryFn,
    meta: { params },
    ...options,
  });
};

/**
 * Get timeseries metrics
 */
export const useGetMetricsTimeSeries: ADSQuery<Bibcode[], IADSApiMetricsResponse> = (bibcodes, options) => {
  const params = getMetricsTimeSeriesParams(bibcodes);

  return useQuery({
    queryKey: metricsKeys.timeSeries(bibcodes),
    queryFn: fetchMetrics,
    retry: retryFn,
    meta: { params },
    ...options,
  });
};

export const fetchMetrics: QueryFunction<IADSApiMetricsResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiMetricsParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_METRICS,
    data: params,
  };

  const { data: metrics } = await api.request<IADSApiMetricsResponse>(config);

  if (isNil(metrics)) {
    throw new Error('No Metrics');
  }

  if (metrics[MetricsResponseKey.E]) {
    throw new Error(metrics[MetricsResponseKey.EI] ? metrics[MetricsResponseKey.EI] : 'No Metrics');
  }
  return metrics;
};
