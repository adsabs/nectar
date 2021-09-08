import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import { IADSApiVaultParams, IADSApiVaultResponse } from './types';

export class VaultService extends Service {
  async query({
    bigquery,
    sort = ['date desc'],
    q = '*:*',
    fq = '{!bitset}',
    ...otherParams
  }: IADSApiVaultParams): Promise<Result<IADSApiVaultResponse, Error | AxiosError>> {
    return await new Promise((resolve) => {
      const config: AxiosRequestConfig = {
        method: 'POST',
        url: `${ApiTargets.MYADS_STORAGE}/query`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        data: {
          bigquery,
          sort,
          q,
          fq,
          ...otherParams,
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
