import type { NectarSessionResponse, ScixUser } from '@server/types';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { buildStorage, CacheOptions, setupCache, StorageValue } from 'axios-cache-interceptor';
import { __, all, allPass, complement, identity, includes, is, isEmpty, propSatisfies } from 'ramda';

import { IUserData } from '@/api';
import { logger } from '@/logger';
import { updateAppUser } from '@/store';

import { defaultRequestConfig } from './config';

const isUserData = (userData: unknown): userData is IUserData => {
  return allPass([
    is(Object), // Checks if userData is an object
    propSatisfies(is(String), 'expire'), // Checks if 'expire' is a string
    propSatisfies(complement(isEmpty), 'expire'), // Checks if 'expire' is not an empty string
    propSatisfies(is(String), 'token'), // Checks if 'token' is a string
    propSatisfies(complement(isEmpty), 'token'), // Checks if 'token' is not an empty string
    propSatisfies(is(String), 'name'), // Checks if 'name' is a string
    propSatisfies(is(Array), 'permissions'), // Checks if 'permissions' is an array
    propSatisfies(all(is(String)), 'permissions'), // Checks if all elements in 'permissions' are strings
    propSatisfies(includes(__, ['anonymous', 'user']), 'role'), // Checks if 'role' is either 'anonymous' or 'user'
  ])(userData);
};

export const isAuthenticated = (user: IUserData) => isUserData(user) && user.role === 'user';

export const checkUserData = (userData?: IUserData): boolean => {
  return isUserData(userData);
};

/**
 * Apply a bearer token string to the request's headers
 * returns a new request config with authorization header added
 */
const applyTokenToRequest = (request: ApiRequestConfig, token: string): ApiRequestConfig => {
  return {
    ...request,
    headers: {
      ...request.headers,
      authorization: `Bearer ${token}`,
    },
  };
};

export type ApiRequestConfig = AxiosRequestConfig;

enum API_STATUS {
  UNAUTHORIZED = 401,
}

const log = logger.child({}, { msgPrefix: '[api] ' });

const getClientSideCacheConfig = async () => {
  const idb = await import('idb-keyval');
  const storage = buildStorage({
    async find(key) {
      const value = await idb.get<string>(key);
      if (!value) {
        return;
      }
      return JSON.parse(value) as StorageValue;
    },
    async set(key, value) {
      await idb.set(key, JSON.stringify(value));
    },
    async remove(key) {
      await idb.del(key);
    },
  });

  const config: CacheOptions = {
    debug: log.debug,
    cacheTakeover: false,
    cachePredicate: {
      ignoreUrls: [/^(?!\/search\/)/],
    },
    storage,
  };

  return config;
};

/**
 * Api structure that wraps the axios instance
 * This allows us to manage the setting/resetting of the token
 * and to persist a particular instance over multiple requests
 */
class Api {
  private static instance: Api;
  private service: AxiosInstance;
  private userData: ScixUser | null;
  private bootstrapRetries = 2;
  private recentError: { status: number; config: AxiosRequestConfig } | null;

  private constructor() {
    this.service = axios.create(defaultRequestConfig);
    this.userData = null;
    this.recentError = null;
    void this.init();
  }

  private async init() {
    this.service.interceptors.response.use(identity, (error: AxiosError & { canRefresh: boolean }) => {
      log.error(error);
      if (axios.isAxiosError(error)) {
        // if the server never responded, there won't be a response object -- in that case, reject immediately
        // this is important for SSR, just fail fast
        if (!error.response || typeof global.window === 'undefined') {
          return Promise.reject(error);
        }

        // check if the incoming error is the exact same status and URL as the last request
        // if so, we should reject to keep from getting into a loop
        if (
          this.recentError &&
          this.recentError.status === error?.response.status &&
          this.recentError.config.url === error.config?.url
        ) {
          // clear the recent error
          this.recentError = null;
          log.debug({
            msg: 'Rejecting request due to recent error',
            err: error,
          });
          return Promise.reject(error);
        }

        // if request is NOT bootstrap, store error config
        if (error.config?.url !== '/api/user') {
          this.recentError = {
            status: error.response.status,
            config: error.config ?? {},
          };
        }

        if (error.response.status === API_STATUS.UNAUTHORIZED) {
          this.invalidateUserData();

          log.debug({
            msg: 'Unauthorized request, refreshing token and retrying',
            err: error,
          });

          // retry the request
          return this.request(error.config as ApiRequestConfig);
        }
      }
      return Promise.reject(error);
    });

    // setup clientside caching
    if (typeof global.window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        setupCache(this.service, await getClientSideCacheConfig());
      } catch (err) {
        log.error({ err });
      }
    }
  }

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  public setUserData(userData: ScixUser) {
    this.userData = userData;
  }

  private invalidateUserData() {
    updateAppUser(null);
    this.userData = null;
  }

  private async getOrRefreshToken(): Promise<string> {
    log.info({ msg: 'Getting or refreshing token' });

    if (checkUserData(this.userData)) {
      log.debug({ msg: 'User data present, using token', data: this.userData });
      return this.userData.token;
    }
    const { data } = await axios.get<NectarSessionResponse>('/api/auth/session');
    log.debug({ msg: 'User data refreshed', data });
    this.setUserData(data.user);
    updateAppUser(data.user);
    return data.user.token;
  }

  /**
   * Main request method
   * Authenticate and fire the request
   */
  async request<T>(config: ApiRequestConfig): Promise<AxiosResponse<T>> {
    if (process.env.NODE_ENV === 'development') {
      log.info({
        msg: 'API Request',
        config,
        userData: this.userData,
      });
    }
    try {
      await this.getOrRefreshToken();
    } catch (err) {
      log.error({ msg: 'Unable to refresh token' });
      return Promise.reject('Unable to refresh token');
    }
    return this.service.request<T>(applyTokenToRequest(config, this.userData.token));
    // serverside, we can just send the request
    // if (typeof global.window === 'undefined') {
    //   return this.service.request<T>(
    //     applyTokenToRequest(config, this.userData.token),
    //   );
    // }

    // we have valid token, send the request right away
    // if (checkUserData(this.userData)) {
    //   return this.service.request<T>(
    //     applyTokenToRequest(config, this.userData.token),
    //   );
    // }

    // fetch it from the server
    // await this.fetchUserData();
    // return this.service.request<T>(
    //   applyTokenToRequest(config, this.userData.token),
    // );

    // // finally, we have to attempt a bootstrap request
    // try {
    //   const freshUserData = await this.fetchUserData();
    //
    //   // if we don't have valid user data, throw an error
    //   if (!checkUserData(freshUserData)) {
    //     return Promise.reject(new Error('Unable to refresh token'));
    //   }
    //
    //   // set user data property and in the app store
    //   this.setUserData(freshUserData);
    //   updateAppUser(freshUserData);
    //
    //   return this.service.request<T>(applyTokenToRequest(config, freshUserData.access_token));
    // } catch (e) {
    //   if (this.bootstrapRetries > 0) {
    //     this.bootstrapRetries -= 1;
    //     return this.request(config);
    //   }
    //   // bootstrapping failed all attempts, let user know
    //   const bootstrapError = new Error('Unrecoverable Error, unable to refresh token', { cause: e as Error });
    //   return Promise.reject(bootstrapError);
    // }
  }

  async fetchUserData() {}

  public reset() {
    this.service = this.service = axios.create(defaultRequestConfig);
    void this.init();
    this.userData = null;
    this.recentError = null;
    this.bootstrapRetries = 2;
  }
}

export default Api.getInstance();
