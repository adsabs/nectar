import { SetupServerApi } from 'msw/node';

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}

declare module 'iron-session' {
  interface IronSessionData {
    token?: {
      access_token: string;
      anonymous: boolean;
      expire_in: string;
      username: string;
    };
    isAuthenticated?: boolean;
    apiCookieHash?: number[];
  }
}
