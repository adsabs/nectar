import AdsApi, { IADSApiGraphicsParams, IADSApiGraphicsResponse } from '@api';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
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

  async hasGraphics(api: AdsApi, bibcode: string): Promise<boolean> {
    const result = await api.graphics.query({
      bibcode: bibcode,
    });
    return result.isErr() ? false : true;
  }
}
