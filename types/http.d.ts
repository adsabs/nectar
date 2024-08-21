import { RequestOptions } from 'src/plugins/fetcher';

import { IADSApiSearchParams, IADSApiSearchResponse } from '../apps/client/src/api';
import { FetcherError } from '../apps/server/src/plugins/fetcher';

declare module 'node:http' {
  interface IncomingMessage {
    session: {
      user: SessionData['user'];
    };
    fetch: <T>(options: RequestOptions, extraOptions = { cache: true }) => Promise<T | { error: string }>;
    search: () => Promise<{
      query: IADSApiSearchParams;
      response: IADSApiSearchResponse;
      error?: FetcherError;
    }>;
    details: () => Promise<{
      doc: IDocsEntity;
      query?: IADSApiSearchParams;
      error?: FetcherError;
    }>;
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
