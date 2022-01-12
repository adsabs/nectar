import { IDocsEntity } from '@api';
import { ApiTargets } from '@api/lib/models';
import { BasicStatsKey, CitationsStatsKey, MetricsResponseKey } from '@_api/metrics/types';
import { ADSQuery } from '@_api/types';
import { isNil } from 'ramda';
import { QueryFunction, useQuery, UseQueryResult } from 'react-query';
import api, { ApiRequestConfig } from '../api';
import { IADSApiMetricsResponse } from './types';

const MAX_RETRIES = 3;

export const metricsKeys = {
  primary: (bibcode: IDocsEntity['bibcode']) => ['metrics', { bibcode }] as const,
};

const retryFn = (count: number, error: Error) => {
  if (count >= MAX_RETRIES || error.message.startsWith('No data available')) {
    return false;
  }

  return true;
};

/**
 * Fetches metrics and checks if citations and reads exist
 */
export const useHasMetrics: ADSQuery<IDocsEntity['bibcode'], boolean> = (bibcode, options) => {
  const { data, isError } = useQuery({
    queryKey: metricsKeys.primary(bibcode),
    queryFn: fetchMetrics,
    retry: retryFn,
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

type useGetMetricsResult = UseQueryResult<Partial<IADSApiMetricsResponse>>;

/**
 * Get metrics based on bibcode
 */
export const useGetMetrics: ADSQuery<IDocsEntity['bibcode'], useGetMetricsResult> = (bibcode, options) => {
  return useQuery({
    queryKey: metricsKeys.primary(bibcode),
    queryFn: fetchMetrics,
    retry: retryFn,
    ...options,
  });
};

export const fetchMetrics: QueryFunction<
  IADSApiMetricsResponse,
  Readonly<[string, { bibcode: IDocsEntity['bibcode'] }]>
> = async ({ queryKey: [, { bibcode }] }) => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.SERVICE_METRICS}/${bibcode}`,
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
