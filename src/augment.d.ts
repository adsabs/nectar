import { SetupServerApi } from 'msw/lib/types/node';

declare module 'next/config' {
  interface AppRuntimeConfig {
    publicRuntimeConfig: {
      apiHost: string;
    };
    serverRuntimeConfig: {
      apiHost: string;
      baseCanonicalUrl: string;
    };
  }
  export default function getConfig(): AppRuntimeConfig;
}

declare module 'vitest' {
  export interface TestContext {
    server?: SetupServerApi;
  }
}
