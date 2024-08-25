import type { NectarSessionResponse, ScixUser } from '@server/types';
import { to as toReq } from 'await-to-js';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { __, all, allPass, complement, identity, includes, is, isEmpty, propSatisfies } from 'ramda';

import { logger } from '@/logger';

import { defaultRequestConfig } from './config';

// const isUserData = (userData: unknown): userData is IUserData => {
//   return allPass([
//     is(Object), // Checks if userData is an object
//     propSatisfies(is(String), 'expire'), // Checks if 'expire' is a string
//     propSatisfies(complement(isEmpty), 'expire'), // Checks if 'expire' is not an empty string
//     propSatisfies(is(String), 'token'), // Checks if 'token' is a string
//     propSatisfies(complement(isEmpty), 'token'), // Checks if 'token' is not an empty string
//     propSatisfies(is(String), 'name'), // Checks if 'name' is a string
//     propSatisfies(is(Array), 'permissions'), // Checks if 'permissions' is an array
//     propSatisfies(all(is(String)), 'permissions'), // Checks if all elements in 'permissions' are strings
//     propSatisfies(includes(__, ['anonymous', 'user']), 'role'), // Checks if 'role' is either 'anonymous' or 'user'
//   ])(userData);
// };

// export const isAuthenticated = (user: IUserData) => isUserData(user) && user.role === 'user';
//
// export const checkUserData = (userData?: IUserData): boolean => {
//   return isUserData(userData);
// };

/**
 * Apply a bearer token string to the request's headers
 * returns a new request config with authorization header added
 */
// const applyTokenToRequest = (request: ApiRequestConfig, token: string): ApiRequestConfig => {
//   return {
//     ...request,
//     headers: {
//       ...request.headers,
//       authorization: `Bearer ${token}`,
//     },
//   };
// };

export type ApiRequestConfig = AxiosRequestConfig;

enum API_STATUS {
  UNAUTHORIZED = 401,
}

const log = logger.child({}, { msgPrefix: '[api] ' });

// const getClientSideCacheConfig = async () => {
//   const idb = await import('idb-keyval');
//   const storage = buildStorage({
//     async find(key) {
//       const value = await idb.get<string>(key);
//       if (!value) {
//         return;
//       }
//       return JSON.parse(value) as StorageValue;
//     },
//     async set(key, value) {
//       await idb.set(key, JSON.stringify(value));
//     },
//     async remove(key) {
//       await idb.del(key);
//     },
//   });
//
//   const config: CacheOptions = {
//     debug: log.debug,
//     cacheTakeover: false,
//     cachePredicate: {
//       ignoreUrls: [/^(?!\/search\/)/],
//     },
//     storage,
//   };
//
//   return config;
// };

const to = async <T = unknown>(promise: Promise<AxiosResponse<T>>) => toReq<AxiosResponse<T>, AxiosError<T>>(promise);

class SessionManager {
  private static SESSION_ENDPOINT = '/api/auth/session';
  private static REFRESH_ENDPOINT = '/api/auth/refresh';
  private user: ScixUser | null;
  private errors: ErrorManager;

  constructor() {
    this.user = null;
    this.errors = new ErrorManager();
  }

  private validateSession() {
    allPass([
      is(Object), // Checks if userData is an object
      propSatisfies(is(String), 'expire'), // Checks if 'expire' is a string
      propSatisfies(complement(isEmpty), 'expire'), // Checks if 'expire' is not an empty string
      propSatisfies(is(String), 'token'), // Checks if 'token' is a string
      propSatisfies(complement(isEmpty), 'token'), // Checks if 'token' is not an empty string
      propSatisfies(is(String), 'name'), // Checks if 'name' is a string
      propSatisfies(is(Array), 'permissions'), // Checks if 'permissions' is an array
      propSatisfies(all(is(String)), 'permissions'), // Checks if all elements in 'permissions' are strings
      propSatisfies(includes(__, ['anonymous', 'user']), 'role'), // Checks if 'role' is either 'anonymous' or 'user'
    ])(this.user);
  }

  private setUser(user: ScixUser) {
    this.user = user;
  }

  async getSessionToken(): Promise<string | null> {
    log.debug('Getting session token');
    if (this.user && this.user.token.length > 0) {
      return this.user.token;
    }

    const [err, res] = await to(
      axios.get<NectarSessionResponse>(SessionManager.SESSION_ENDPOINT, {
        withCredentials: true,
      }),
    );

    if (err) {
      if (err.response?.status === 401) {
        this.errors.emit({ err, type: 'error' }, 'Your session may have expired, please refresh this page');
        return Promise.reject('Session may have expired');
      } else if (err.response?.status === 429) {
        this.errors.emit({ err, type: 'error' }, 'Too many requests, please wait a minute and try again');
        return Promise.reject('Too many requests');
      }
      this.errors.emit(
        { err: err as Error, type: 'error' },
        'Having trouble contacting server, search and other features may not work properly',
      );
      return Promise.reject('Having trouble contacting server, search and other features may not work properly');
    }
    if (res) {
      this.setUser(res.data.user);
      return res.data.user.token;
    }
    return Promise.reject('Unable to authorize request to API');
  }

  async refreshSessionToken(): Promise<string | null> {
    log.debug('Refreshing session token');
    const [err, res] = await to(
      axios.get<{ user: ScixUser }>(SessionManager.REFRESH_ENDPOINT, { withCredentials: true }),
    );

    if (err) {
      if (err.response?.status === 401) {
        this.errors.emit({ err, type: 'error' }, 'Your session may have expired, please refresh this page');
      } else if (err.response?.status === 429) {
        this.errors.emit({ err, type: 'error' }, 'Too many requests, please wait a minute and try again');
      }
      this.errors.emit(
        { err: err as Error, type: 'error' },
        'Having trouble contacting server, search and other features may not work properly',
      );
    }

    if (res) {
      this.setUser(res.data.user);
      return res.data.user.token;
    }

    return null;
  }
}

class ErrorManager {
  constructor() {}
  emit({ err, type }: { err: Error; type: 'info' | 'error' }, msg = 'API Error') {
    log.error({ err, type }, msg);
  }
}

class Api {
  private static instance: Api;
  private service: AxiosInstance;
  private session: SessionManager;
  private errors: ErrorManager;

  constructor() {
    this.service = axios.create(defaultRequestConfig);
    this.session = new SessionManager();
    this.errors = new ErrorManager();
    // this.service.interceptors.request.use(this.addSessionToken.bind(this));
    this.service.interceptors.response.use(identity, this.handleErrorResponse.bind(this));
  }

  public async request<T = unknown>(config: ApiRequestConfig) {
    await this.session.getSessionToken();
    const [err, res] = await to<T>(this.service.request<T>(config));
    if (err) {
      log.trace({ err, config }, 'Error fetching from API');
      throw err;
    }
    return res;
  }

  private async handleErrorResponse(err: AxiosError) {
    log.error({ err }, 'API Error intercepted');
    if (err.response?.status === 401) {
      this.errors.emit({ err, type: 'info' }, 'Got unauthorized reply when fetching from the api');
      const token = await this.session.refreshSessionToken();

      if (!token) {
        log.error({ token }, 'No token, stopping request');
        return Promise.reject('Unable to authorize request to API');
      }

      return this.service.request(err.config as ApiRequestConfig);
    }
    if (err.response?.status === 429) {
      this.errors.emit({ err, type: 'error' }, 'Too many requests, please wait a minute and try again');
      return Promise.reject(err);
    }
    return Promise.reject(err);
  }

  // private async addSessionToken(config: InternalAxiosRequestConfig) {
  //   const token = await this.session.getSessionToken();
  //
  //   if (!token) {
  //     log.error({ token }, 'No token, stopping request');
  //     return Promise.reject('Unable to authorize request to API');
  //   }
  //
  //   if (token && config) {
  //     config.headers.Authorization = `Bearer ${token}`;
  //   }
  //
  //   return config;
  // }

  // Singleton: Provides global access to the instance
  public static getInstance(): Api {
    if (!this.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }
}

export default Api.getInstance();
