import { AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import {
  IADSApiSearchParams,
  IADSApiSearchResponse,
  INormalizedADSApiSearchParams,
} from './types';

export class SearchService extends Service {
  private normalizeParams(
    params: IADSApiSearchParams,
  ): INormalizedADSApiSearchParams {
    // if (!validate(params)) {
    //   throw new Error(
    //     validate.errors
    //       ?.map((e) => `${e.dataPath} ${e.message ?? ''}`)
    //       .join('\n'),
    //   );
    // }

    return {
      ...params,
      sort: params.sort?.join(','),
      fl: ['id', ...(params.fl ?? [])].join(','),
    };
  }

  async query(
    rawParams: IADSApiSearchParams,
  ): Promise<Result<IADSApiSearchResponse['response'], Error>> {
    const params = this.normalizeParams(rawParams);
    const config: AxiosRequestConfig = {
      method: 'get',
      url: ApiTargets.SEARCH,
      params,
    };

    return await new Promise((resolve) => {
      this.request<IADSApiSearchResponse>(config).then(
        (result) => {
          result.match(
            ({ response }) => resolve(ok(response)),
            (e) => resolve(err(e)),
          );
        },
        (e) => resolve(err(e)),
      );
    });
  }
}
