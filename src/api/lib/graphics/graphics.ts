import { IADSApiGraphicsParams } from '@api';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import { IADSApiGraphicsResponse } from './types';

export class GraphicsService extends Service {
  async query(params: IADSApiGraphicsParams): Promise<Result<IADSApiGraphicsResponse, Error | AxiosError>> {
    const config: AxiosRequestConfig = {
      method: 'get',
      url: `${ApiTargets.GRAPHICS}/${params.bibcode}`,
    };

    return await new Promise((resolve) => {
      this.request<IADSApiGraphicsResponse>(config).then(
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
