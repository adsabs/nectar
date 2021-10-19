import AdsApi, { IADSApiMetricsParams, IADSApiMetricsResponse } from '@api';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import { BasicStatsKey, CitationsStatsKey, MetricsResponseKey } from './types';

export class MetricsService extends Service {
  async query(params: IADSApiMetricsParams): Promise<Result<IADSApiMetricsResponse, Error | AxiosError>> {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: `${ApiTargets.SERVICE_METRICS}/${params.bibcode}`,
    };

    return await new Promise((resolve) => {
      this.request<IADSApiMetricsResponse>(config).then(
        (result) => {
          result.match(
            (response) => {
              if (!response.Error) {
                resolve(ok(response));
              } else {
                resolve(err(new Error(response.Error)));
              }
            },
            (e: Error | AxiosError) => resolve(err(e)),
          );
        },
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }

  async hasMetrics(api: AdsApi, bibcode: string): Promise<boolean> {
    const result = await api.metrics.query({
      bibcode: bibcode,
    });

    if (result.isErr()) {
      return false;
    }

    const metrics = result.value;
    const hasCitations =
      metrics && metrics[MetricsResponseKey.CITATION_STATS][CitationsStatsKey.TOTAL_NUMBER_OF_CITATIONS] > 0;
    const hasReads = metrics && metrics[MetricsResponseKey.BASIC_STATS][BasicStatsKey.TOTAL_NUMBER_OF_READS] > 0;

    return hasCitations || hasReads;
  }
}
