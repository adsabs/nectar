import { Service } from './service';

export interface IADSApiArticlesParams {
  q: string;
}

export interface IADSApiArticlesResponse {
  docs: string[];
}

export interface IADSApiArticlesErrorResponse {
  error: string;
}

export interface IArticleResponse {
  docs: string[];
}

export class ArticlesService extends Service {
  constructor() {
    super();
  }

  async query(params: IADSApiArticlesParams): Promise<IArticleResponse> {
    try {
      const data = await this.request<
        IADSApiArticlesResponse,
        IADSApiArticlesErrorResponse
      >({
        method: 'get',
        url: '/search/query',
        params,
      });
      return data;
    } catch (e) {
      throw new Error(e);
    }
  }
}
