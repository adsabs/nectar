import { rootService } from '@machines';

export interface NectarPage {
  service: typeof rootService;
}

export interface AppRuntimeConfig {
  publicRuntimeConfig: {
    apiHost: string;
  };
  serverRuntimeConfig: Record<string, string>;
}
