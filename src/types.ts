import { IADSApiSearchParams, IUserData } from '@api';
import { APP_DEFAULTS } from '@config';

export enum Theme {
  GENERAL = 'GENERAL',
  ASTROPHYSICS = 'ASTROPHYSICS',
  HELIOPHYISCS = 'HELIOPHYSICS',
  PLANET_SCIENCE = 'PLANET_SCIENCE',
  EARTH_SCIENCE = 'EARTH_SCIENCE',
  BIO_PHYSICAL = 'BIO_PHYSICAL_SCIENCE',
}

export enum AppErrorCode {
  SERVER_ERROR,
}

interface InnerError {
  code: AppErrorCode;
  [key: string]: unknown;
}

export interface AppError {
  code: AppErrorCode;
  message: string;
  target?: string;
  details?: Pick<AppError, 'code' | 'message' | 'target'>[];
  innererror?: {
    code: AppErrorCode;
    innererror?: InnerError;
  };
}

export interface SessionData {
  userData: IUserData;
}

declare module 'http' {
  interface IncomingMessage {
    session: SessionData;
  }
}

export type NumPerPageType = typeof APP_DEFAULTS['PER_PAGE_OPTIONS'][number];

export type SafeSearchUrlParams = Omit<IADSApiSearchParams, 'fl' | 'start' | 'rows'> & { p?: number; n?: number };
