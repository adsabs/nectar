import { SetupServerApi } from 'msw/node';

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}

declare module 'iron-session' {
  interface IronSessionData {
    user?: {
      id: number;
      admin?: boolean;
    };
  }
}
