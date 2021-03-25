import { ApiTargets } from '../models';
import { Service } from '../service';
import {
  IADSApiSearchErrorResponse,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  INormalizedADSApiSearchParams,
} from './types';
import { validate } from './validator';

export class SearchService extends Service {
  private normalizeParams(
    params: IADSApiSearchParams,
  ): INormalizedADSApiSearchParams {
    if (!validate(params)) {
      throw new Error(
        validate.errors
          ?.map((e) => `${e.dataPath} ${e.message ?? ''}`)
          .join('\n'),
      );
    }

    return {
      ...params,
      sort: params.sort?.map(([type, dir]) => `${type} ${dir}`).join(' '),
      fl: ['id', ...(params.fl ?? [])].join(','),
    };
  }

  async query(
    rawParams: IADSApiSearchParams,
  ): Promise<IADSApiSearchResponse['response']> {
    const params = this.normalizeParams(rawParams);

    const { response } = await this.request<
      IADSApiSearchResponse,
      IADSApiSearchErrorResponse
    >({
      method: 'get',
      url: ApiTargets.SEARCH,
      params,
    });

    return response;
  }
}
