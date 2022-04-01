import { IADSApiMetricsParams } from '@api';
import { ApiTargets } from '@api/lib/models';
import { Bibcode } from '@api/lib/search/types';
import { BasicStatsKey, CitationsStatsKey, MetricsResponseKey } from '@_api/metrics';
import { ADSQuery } from '@_api/types';
import { isNil } from 'ramda';
import { QueryFunction, useQuery } from 'react-query';
import api, { ApiRequestConfig } from '../api';
import { getMetricsParams, getMetricsTimeSeriesParams } from './model';
import { IADSApiMetricsResponse } from './types';

const MAX_RETRIES = 3;

export const metricsKeys = {
  primary: (bibcodes: Bibcode[]) => ['metrics', { bibcodes }] as const,
  timeSeries: (bibcodes: Bibcode[]) => ['metrics/timeSeries', { bibcodes }] as const,
};

export const metricsMultKeys = {
  primary: (bibcodes: IDocsEntity['bibcode'][]) => ['metricsMult', { bibcodes }] as const,
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
  const params = { bibcode };

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

export const useGetMetricsMult: ADSQuery<IDocsEntity['bibcode'][], IADSApiMetricsResponse> = (bibcodes, options) => {
  const params = { bibcodes };

  return useQuery({
    queryKey: metricsMultKeys.primary(bibcodes),
    queryFn: fetchMetricsMult,
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

export const fetchMetricsMult: QueryFunction<IADSApiMetricsResponse> = async ({ meta }) => {
  const { params } = meta as { params: IADSApiMetricsParams };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.SERVICE_METRICS}`,
    data: {
      bibcodes: params.bibcodes,
    },
  };

  const res = await api.request<IADSApiMetricsResponse>(config);

  const { data: metrics } = res;

  if (isNil(metrics)) {
    throw new Error('No Metrics');
  }

  if (metrics[MetricsResponseKey.E]) {
    throw new Error(metrics[MetricsResponseKey.EI] ? metrics[MetricsResponseKey.EI] : 'No Metrics');
  }
  return metrics;
};
