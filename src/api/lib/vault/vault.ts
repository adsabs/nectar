import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import { IADSApiVaultParams, IADSApiVaultResponse } from './types';

export class VaultService extends Service {
  async query({
    q,
    sort = ['date desc'],
  }: IADSApiVaultParams): Promise<Result<IADSApiVaultResponse, Error | AxiosError>> {
    return await new Promise((resolve) => {
      const config: AxiosRequestConfig = {
        method: 'get',
        url: `${ApiTargets.MYADS_STORAGE}/query`,
        params: {
          bigquery: q,
          sort,
          q: '*:*',
          fq: '{!bitset}',
        },
      };

      this.request<IADSApiVaultResponse>(config).then(
        (result) => {
          result.match(
            (response) => resolve(ok(response)),
            (e: Error | AxiosError) => resolve(err(e)),
          );
        },
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }
}
