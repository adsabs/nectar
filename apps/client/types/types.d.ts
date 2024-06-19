import { SetupServerApi } from 'msw/node';

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}
