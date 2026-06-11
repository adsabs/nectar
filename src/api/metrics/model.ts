import { Bibcode } from '@/api/search/types';
import { IADSApiMetricsParams, IAdsApiMetricsTypes } from './types';

export const getMetricsParams = (bibcodes: Bibcode[]): IADSApiMetricsParams => ({
  bibcodes: bibcodes,
  types: [IAdsApiMetricsTypes.SIMPLE],
});

export const getMetricsTimeSeriesParams = (bibcodes: Bibcode[]): IADSApiMetricsParams => ({
  bibcodes,
  types: [IAdsApiMetricsTypes.INDICATORS, IAdsApiMetricsTypes.TIMESERIES],
});
