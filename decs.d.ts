import { SetupServerApi } from 'msw/lib/types/node';

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}
