import { IADSApiMetricsParams, IADSApiMetricsResponse } from '@api';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';

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
}
