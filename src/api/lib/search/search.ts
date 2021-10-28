import { SolrField } from '@api';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { err, ok, Result } from 'neverthrow';
import { ApiTargets } from '../models';
import { Service } from '../service';
import {
  IADSApiSearchParams,
  IADSApiSearchResponse,
  IDocsEntity,
  IDocument,
  INormalizedADSApiSearchParams,
} from './types';

export class SearchService extends Service {
  private normalizeParams(params: IADSApiSearchParams): INormalizedADSApiSearchParams {
    return {
      ...params,
      sort: params.sort?.join(','),
      fl: ['id', ...(params.fl ?? [])].join(','),
    };
  }

  async query(rawParams: IADSApiSearchParams): Promise<Result<IADSApiSearchResponse['response'], Error | AxiosError>> {
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
            (e: Error | AxiosError) => resolve(err(e)),
          );
        },
        (e: Error | AxiosError) => resolve(err(e)),
      );
    });
  }

  async getDocument(identifier: string, fields: Partial<keyof IDocsEntity>[]): Promise<IDocument> {
    const result = await this.query({
      q: `identifier:${identifier}`,
      fl: fields,
    });

    return result.isErr()
      ? { error: 'Unable to get document' }
      : result.value.numFound === 0
      ? { notFound: true }
      : { doc: result.value.docs[0] };
  }
}
