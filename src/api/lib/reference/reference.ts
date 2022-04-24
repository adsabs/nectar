import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../../../_api/models';
import { IADSApiReferenceParams, IADSApiReferenceResponse } from '../../../_api/reference/types';
import { Service } from '../service';

export class ReferenceService extends Service {
  async query({ reference }: IADSApiReferenceParams): Promise<Result<IADSApiReferenceResponse, Error | AxiosError>> {
    return await new Promise((resolve) => {
      if (typeof reference === 'string' && reference.length > 0) {
        const config: AxiosRequestConfig = {
          method: 'get',
          url: `${ApiTargets.REFERENCE}/${encodeURIComponent(reference)}`,
        };

        this.request<IADSApiReferenceResponse>(config).then(
          (result) => {
            result.match(
              (response) => resolve(ok(response)),
              (e: Error | AxiosError) => resolve(err(e)),
            );
          },
          (e: Error | AxiosError) => resolve(err(e)),
        );
      } else {
        resolve(err(new Error('No reference string')));
      }
    });
  }
}
