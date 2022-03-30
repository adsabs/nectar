import { IUserData } from '@api';
import { IBootstrapPayload } from '@api/lib/accounts/types';
import { ApiTargets } from '@api/lib/models';
import { APP_STORAGE_KEY, updateAppUser } from '@store';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isPast, parseISO } from 'date-fns';
import { PathLike } from 'fs';
import getConfig from 'next/config';
import qs from 'qs';
import { isNil } from 'ramda';

/**
 * Figure out which config to pick, based on the current environment
 */
const resolveApiBaseUrl = (defaultBaseUrl = ''): string => {
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

const checkUserData = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isExpired(userData);
};

/**
 * Reads the current user data from localStorage
 *
 * @returns IUserData
 */
const getUserData = (): IUserData => {
  try {
    const {
      state: { user },
    } = JSON.parse(localStorage.getItem(APP_STORAGE_KEY)) as { state: { user: IUserData } };
    return user;
  } catch (e) {
    return null;
  }
};

/**
 * Inject authorization header with updated token value
 * Also persists userData in localStorage
 *
 * @param  {ApiRequestConfig} request - the request config to be altered
 * @param  {boolean} invalidate? - should skip checking storage, and fetch new user data
 * @returns {Promise<ApiRequestConfig>} - the augmented request
 */
const injectAuth = async (request: ApiRequestConfig, invalidate?: boolean): Promise<ApiRequestConfig> => {
  // read directly from the storage, since we can't be sure store is loaded at the time this is run
  const user = getUserData();

  // check if we have persisted userData in localStorage
  if (typeof window !== 'undefined' && !invalidate) {
    if (checkUserData(user)) {
      // add authorization header to request
      request.headers.authorization = `Bearer:${user.access_token}`;
      return request;
    }
  }

  // fetch the current userData using default axios instance
  const {
    data: { access_token, username, expire_in, anonymous },
  } = await axios.get<IBootstrapPayload>(ApiTargets.BOOTSTRAP, {
    baseURL: resolveApiBaseUrl('https://devapi.adsabs.harvard.edu/v1'),
  });

  if (typeof window !== 'undefined') {
    updateAppUser({ access_token, username, expire_in, anonymous });
  }

  // add authorization header to request
  request.headers.authorization = `Bearer:${access_token}`;

  return request;
};

export interface ApiRequestConfig extends AxiosRequestConfig {
  headers?: { authorization?: string };
}

const config: AxiosRequestConfig = {
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: 30000,
  paramsSerializer: (params: PathLike) => qs.stringify(params, { indices: false }),
  headers: {
    common: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
  },
};

class Api {
  private static instance: Api;

  // token property will only be used server-side
  private token: string;
  private service: AxiosInstance;
  private latestRequest: ApiRequestConfig;

  private constructor() {
    this.service = axios.create(config);
    this.init();
  }

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  setToken(token: string) {
    this.token = token;
  }

  request<T>(config: ApiRequestConfig): Promise<AxiosResponse<T>> {
    return this.service.request<T>(config);
  }

  /**
   * Initialize the api service
   * Create the request/response interceptors for handling tokens
   */
  private init() {
    // inject a token into a non-auth'd request
    const injectToken = async (request: ApiRequestConfig) => {
      // will use passed-in token, if it was done server-side
      if (typeof this.token === 'string' && this.token.length > 0 && typeof window === 'undefined') {
        request.headers.authorization = `Bearer:${this.token}`;
        return request;
      }

      // inject the request with token header
      const requestWithAuth = await injectAuth(request);
      this.latestRequest = requestWithAuth;
      return requestWithAuth;
    };

    // handle 401 errors, re-fetching request after applying a new token
    const handleResponseError = async (error: AxiosError) => {
      // on error, check if it was a 401 (unauthorized)
      if (error.message.includes('401')) {
        // re-inject auth header, invalidating the persisted token
        const request = await injectAuth(this.latestRequest, true);

        // replay the request
        return await this.service.request(request);
      }
      return Promise.reject(error);
    };

    this.service.interceptors.response.use((_) => _, handleResponseError);
    this.service.interceptors.request.use(injectToken);
  }
}

export default Api.getInstance();
