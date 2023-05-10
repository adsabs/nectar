import { SetupServerApi } from 'msw/node';
import { IUserData } from '@api';

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}

declare module 'iron-session' {
  interface IronSessionData {
    token?: IUserData;
    isAuthenticated?: boolean;
  }
}

