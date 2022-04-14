import { metricsKeys } from './metrics';
import { IADSApiMetricsParams, IAdsApiMetricsTypes } from './types';

export const getMetricsParams = (bibcodes: Parameters<typeof metricsKeys.primary>[0]): IADSApiMetricsParams => ({
  bibcodes: bibcodes,
  types: [IAdsApiMetricsTypes.SIMPLE],
});

export const getMetricsTimeSeriesParams = (
  bibcodes: Parameters<typeof metricsKeys.timeSeries>[0],
): IADSApiMetricsParams => ({
  bibcodes,
  types: [IAdsApiMetricsTypes.INDICATORS, IAdsApiMetricsTypes.TIMESERIES],
});
