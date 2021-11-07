import { IUserData } from '@api';

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
