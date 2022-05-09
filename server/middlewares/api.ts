import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { isPast, parseISO } from 'date-fns';
import { RequestHandler as Middleware } from 'express';
import { PathLike } from 'fs';
import getConfig from 'next/config';
import qs from 'qs';
import { isNil } from 'ramda';
import { IBootstrapPayload, IUserData } from '../../src/api/accounts/types';
import { ApiTargets } from '../../src/api/models';

const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

const checkUserData = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isPast(parseISO(userData.expire_in));
};

/**
 * Figure out which config to pick, based on the current environment
 */
const resolveApiBaseUrl = (defaultBaseUrl = ''): string => {
  // for mocking requests, just shortcut the baseURL here
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' && process.env.NODE_ENV !== 'production') {
    return '/';
  }

  const config = getConfig();

  if (typeof config === 'undefined') {
    return defaultBaseUrl;
  }

  const configType = typeof window === 'undefined' ? 'serverRuntimeConfig' : 'publicRuntimeConfig';
  return config[configType]?.apiHost ?? defaultBaseUrl;
};

export const defaultConfig: AxiosRequestConfig = {
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: 30000,
  paramsSerializer: (params: PathLike) => qs.stringify(params, { indices: false, arrayFormat: 'comma' }),
  headers: {
    common: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
  },
};

interface IADSApiBootstrapResponse extends AxiosResponse<IBootstrapPayload> {
  headers: {
    'set-cookie': string;
  };
}

export const api: Middleware = (req, res, next) => {
  // grab reference to our current session from the request
  const session = req.session;
  const currentUserData = session.userData ?? null;

  // check if we have valid current userData, if so move on
  if (checkUserData(currentUserData)) {
    return next();
  }

  axios
    .get<IBootstrapPayload, IADSApiBootstrapResponse>(ApiTargets.BOOTSTRAP, defaultConfig)
    .then((response) => {
      const { data, headers } = response;

      session.userData = data;
      res.setHeader('set-cookie', headers['set-cookie']);
    })
    .catch((e) => {
      console.log('Server-side bootstrapping error\n', e);
    })
    .finally(() => {
      next();
    });
};
