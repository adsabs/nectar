import { AxiosRequestConfig } from 'axios';
import { isPast, parseISO } from 'date-fns';
import getConfig from 'next/config';
import { isNil } from 'ramda';
import Adsapi, { IUserData } from '../';

/**
 * Figure out which config to pick, based on the current environment
 */
export const resolveApiBaseUrl = (defaultBaseUrl = ''): string => {
  const config = getConfig();

  if (typeof config === 'undefined') {
    return defaultBaseUrl;
  }

  const configType = typeof window === 'undefined' ? 'serverRuntimeConfig' : 'publicRuntimeConfig';
  return config[configType]?.apiHost ?? defaultBaseUrl;
};

const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

const isExpired = (userData: IUserData): boolean => {
  return isPast(parseISO(userData.expire_in));
};

export const checkUserData = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isExpired(userData);
};

export const safeParse = <T>(value: string, defaultValue: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch (e) {
    return defaultValue;
  }
};

/**
 * @constant AUTH_STORAGE_KEY - localStorage key used for userData
 */
export const AUTH_STORAGE_KEY = 'nectar-user';

/**
 * Inject authorization header with updated token value
 * Also persists userData in localStorage
 *
 * @param  {AxiosRequestConfig} request - the request config to be altered
 * @param  {boolean} invalidate? - should skip checking storage, and fetch new user data
 * @returns {Promise<AxiosRequestConfig>} - the updated request
 */
export const injectAuth = async (request: AxiosRequestConfig, invalidate?: boolean): Promise<AxiosRequestConfig> => {
  // check if we have persisted userData in localStorage
  if (typeof window !== 'undefined' && !invalidate) {
    const userData = safeParse<IUserData>(localStorage.getItem(AUTH_STORAGE_KEY), null);

    if (checkUserData(userData)) {
      // add authorization header to request
      (request.headers as { authorization: string })['authorization'] = `Bearer:${userData.access_token}`;

      return request;
    }
  }

  // fetch the current userData
  const adsApi = new Adsapi();
  const result = await adsApi.accounts.bootstrap();

  if (result.isOk()) {
    const { access_token, username, expire_in, anonymous } = result.value.data;
    const userData = { access_token, username, expire_in, anonymous };

    if (typeof window !== 'undefined') {
      // persist userData to localStorage
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    }

    // add authorization header to request
    (request.headers as { authorization: string })['authorization'] = `Bearer:${access_token}`;
  }

  return request;
};
