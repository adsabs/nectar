import { IADSApiSearchParams, IUserData } from '@api';
import { APP_DEFAULTS } from '@config';
import { IsomorphicResponse } from '@mswjs/interceptors';
import { MockedRequest } from 'msw';
import { SetupServerApi } from 'msw/lib/types/node';

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

export interface IBibstemOption {
  label: string;
  value: string;
  prefix?: string;
  type?: 'error';
  isDisabled?: boolean;
}

// used for testing
declare global {
  // eslint-disable-next-line no-var
  var __mockServer__: SetupServerApi & {
    onRequest: jest.MockedFunction<(req: MockedRequest) => void>;
    onResponse: jest.MockedFunction<(res: IsomorphicResponse, requestId: string) => void>;
  };
}
