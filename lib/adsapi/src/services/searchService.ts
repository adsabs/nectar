import type { paths } from '../../adsapi-openapi-schema';
import { APIResponse, ServiceConfig } from '../types';
import { BaseService } from './baseService';

const path: keyof paths = '/search/query' as const;

type SearchParams = paths[typeof path]['get']['parameters'];
type SearchResponse = paths[typeof path]['get']['responses']['200']['content']['application/json'];

export class SearchService extends BaseService<SearchResponse> {
  constructor(config: ServiceConfig) {
    super(config);
  }

  public async search(params: SearchParams): Promise<APIResponse<SearchResponse>> {
    return this.request<SearchResponse>({
      method: 'GET',
      url: path,
      params,
    });
  }
}
