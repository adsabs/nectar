import { IDocsEntity } from '@api';
import { ApiTargets } from '@api/lib/models';
import { BasicStatsKey, CitationsStatsKey, MetricsResponseKey } from '@_api/metrics/types';
import { isNil } from 'ramda';
import { QueryFunction, useQuery, UseQueryOptions, UseQueryResult } from 'react-query';
import api, { ApiRequestConfig } from '../api';
import { IADSApiMetricsResponse } from './types';

export const metricsKeys = {
  primary: (bibcode: IDocsEntity['bibcode']) => ['metrics', { bibcode }] as const,
};

const retryFn = (count: number, error: Error) => {
  if (count >= 3 || error.message.startsWith('No data available')) {
    return false;
  }

  return true;
};

export const useHasMetrics = (bibcode: IDocsEntity['bibcode'], options?: UseQueryOptions): boolean => {
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

export const useGetMetrics = (
  bibcode: IDocsEntity['bibcode'],
  options?: UseQueryOptions,
): UseQueryResult<Partial<IADSApiMetricsResponse>> => {
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
