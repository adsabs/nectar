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

export enum Topic {
  GENERAL = 'GENERAL',
  ASTROPHYSICS = 'ASTROPHYSICS',
  HELIOPHYISCS = 'HELIOPHYSICS',
  PLANET_SCIENCE = 'PLANET_SCIENCE',
  EARTH_SCIENCE = 'EARTH_SCIENCE',
  BIO_PHYSICAL = 'BIO_PHYSICAL_SCIENCE'
}
