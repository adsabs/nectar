import { IADSApiBootstrapData } from '@api';

export interface INectarPageProps {
  sessionData: IADSApiBootstrapData;
}

export interface AppRuntimeConfig {
  publicRuntimeConfig: {
    apiHost: string;
  };
  serverRuntimeConfig: Record<string, string>;
}
