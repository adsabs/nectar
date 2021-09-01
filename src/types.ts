import { IUserData } from '@api';

export interface AppRuntimeConfig {
  publicRuntimeConfig: {
    apiHost: string;
  };
  serverRuntimeConfig: Record<string, string>;
}

export enum Theme {
  GENERAL = 'GENERAL',
  ASTROPHYSICS = 'ASTROPHYSICS',
  HELIOPHYISCS = 'HELIOPHYSICS',
  PLANET_SCIENCE = 'PLANET_SCIENCE',
  EARTH_SCIENCE = 'EARTH_SCIENCE',
  BIO_PHYSICAL = 'BIO_PHYSICAL_SCIENCE',
}

interface SessionData {
  userData: IUserData;
}

declare module 'http' {
  interface IncomingMessage {
    session: SessionData;
  }
}
