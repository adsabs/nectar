import { SearchService } from './services/searchService';
import { ServiceConfig } from './types';

export class AdsAPIClient {
  private config: ServiceConfig;
  constructor(config: ServiceConfig) {
    this.config = config;
  }

  public getSearchService(): SearchService {
    return new SearchService(this.config);
  }
}
