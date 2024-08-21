import { RequestOptions } from 'src/plugins/fetcher';

import { DetailsResponse, SearchResponse } from '../apps/server/src/types';

declare module 'node:http' {
  interface IncomingMessage {
    session: {
      user: SessionData['user'];
    };
    fetch: <T>(options: RequestOptions, extraOptions = { cache: true }) => Promise<T | { error: string }>;
    search: () => Promise<SearchResponse>;
    details: () => Promise<DetailsResponse>;
  }
  //   search: {
  //     response: IADSApiSearchResponse;
  //     query: IADSApiSearchParams;
  //     page: number;
  //     error?: {
  //       statusCode: number;
  //       errorMsg: string;
  //       friendlyMessage: string;
  //     };
  //   };
  //   details: {
  //     doc: IDocsEntity;
  //     query?: IADSApiSearchParams;
  //     error?: {
  //       statusCode: number;
  //       errorMsg: string;
  //       friendlyMessage: string;
  //     };
  //   };
  // }
}
