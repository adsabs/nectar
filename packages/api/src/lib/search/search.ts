import { Service } from '../service';
import {
  IADSApiSearchErrorResponse,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  INormalizedADSApiSearchParams,
} from './types';
import { validate } from './validator';

export class SearchService extends Service {
  constructor() {
    super();
  }

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
      fl: params.fl?.join(','),
    };
  }

  async query(
    rawParams: IADSApiSearchParams,
  ): Promise<IADSApiSearchResponse['response']> {
    const params = this.normalizeParams(rawParams);
    try {
      const { response } = await this.request<
        IADSApiSearchResponse,
        IADSApiSearchErrorResponse
      >({
        method: 'get',
        url: '/search/query',
        params,
      });

      return response;
    } catch (e) {
      throw new Error(e);
    }
  }
}
