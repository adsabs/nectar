import { APP_STORAGE_KEY, updateAppUser } from '@/store';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultRequestConfig } from './config';
import { IApiUserResponse } from '@/pages/api/user';
import { logger } from '@/logger';
import { buildStorage, CacheOptions, setupCache, StorageValue } from 'axios-cache-interceptor';
import { isUserData, isValidToken, pickUserData } from '@/auth-utils';
import crypto from 'crypto';
import { identity } from 'ramda';
import { IBootstrapPayload, IUserData } from '@/api/user/types';
import { ApiTargets } from '@/api/models';

export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

/**
 * Reads the current user data from localStorage
 *
 * @returns IUserData
 */
const checkLocalStorageForUserData = (): IUserData => {
  // attempt to read the user data from localStorage
  try {
    const {
      state: { user },
    } = JSON.parse(localStorage.getItem(APP_STORAGE_KEY)) as {
      state: { user: IUserData };
    };
    return user;
  } catch (err) {
    log.error({ err }, 'Error caught attempting to get user data from local storage');
    return null;
  }
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
  private userData: IUserData;
  private udInvalidated: boolean;
  private recentError: { status: number; config: AxiosRequestConfig };
  private pendingRequestsMap: Map<string, Promise<AxiosResponse>>;

  private constructor() {
    this.service = axios.create(defaultRequestConfig);
    this.reset();
    void this.init();
  }

  public getPendingRequests() {
    return this.pendingRequestsMap.entries();
  }

  private async init() {
    this.service.interceptors.response.use(identity, (error: AxiosError & { canRefresh: boolean }) => {
      log.error(error);

      if (this.udInvalidated) {
        return Promise.reject(error);
      }

      if (axios.isAxiosError(error)) {
        // if the server never responded, there won't be a response object -- in that case, reject immediately
        // this is important for SSR, just fail fast
        if (!error.response || typeof window === 'undefined') {
          return Promise.reject(error);
        }

        // check if the incoming error is the exact same status and URL as the last request
        // if so, we should reject to keep from getting into a loop
        if (
          this.recentError &&
          this.recentError.status === error.response.status &&
          this.recentError.config.url === error.config.url
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
        if (error.config.url !== '/api/user') {
          this.recentError = {
            status: error.response.status,
            config: error.config,
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
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        setupCache(this.service, await getClientSideCacheConfig());
      } catch (error) {
        log.error({
          msg: 'Client-side cache not created.',
          error,
        });
      }
    }
  }

  /**
   * Asynchronously obtains API access, refreshing if necessary.
   *
   * @returns {Promise<IUserData | null>} Resolves to API access data or null if retrieval fails.
   */
  private async getUserData(): Promise<IUserData | null> {
    log.debug('Attempting to obtain API access');
    try {
      if (this.udInvalidated) {
        log.debug('API access invalidated, trying to refresh.');
        const refreshedUserData = await this.getRemoteUserData(true);
        if (refreshedUserData) {
          this.udInvalidated = false;
          return refreshedUserData;
        }
        throw new Error('Failed to refresh API access');
      }

      if (isValidToken(this.userData)) {
        log.debug('Valid API access found in memory');
        return this.userData;
      }

      log.debug('Checking local storage for API access data');
      const localStorageUD = checkLocalStorageForUserData();
      if (isValidToken(localStorageUD)) {
        log.debug('Valid API access found in local storage, returning...');
        this.userData = localStorageUD;
        return localStorageUD;
      }

      log.debug('Fetching API access data from session');
      const sessionUserData = await this.getRemoteUserData(false);
      if (sessionUserData) {
        return sessionUserData;
      }
      throw new Error('API access unavailable from session or local storage');
    } catch (e) {
      log.error({ err: e }, 'Failed to obtain API access');
      throw new Error('Unable to obtain API access', { cause: e });
    }
  }

  /**
   * Fetches API access data, refreshing if necessary.
   *
   * @param {boolean} refreshImmediately - Should refresh API access immediately?
   * @returns {Promise<IUserData | null>} API access data or null if unsuccessful.
   */
  private async getRemoteUserData(refreshImmediately: boolean): Promise<IUserData | null> {
    log.debug({ refreshImmediately }, 'Attempting to remotely fetch API access data');
    if (refreshImmediately) {
      log.debug('Trying to refresh API access immediately');
      const refreshedUserData = await this.tryRefreshUserData();
      if (!refreshedUserData) {
        throw new Error('Unable to refresh API access');
      }
      return refreshedUserData;
    }
    // Fetch API access data from the session endpoint
    const sessionUserData = await this.getSessionUserData();
    if (sessionUserData) {
      return sessionUserData;
    }
    // If session fails, try to refresh the data
    return await this.tryRefreshUserData();
  }

  /**
   * Fetches API access data from the session endpoint.
   *
   * @returns {Promise<IUserData | null>} API access data or null if not available.
   */
  private async getSessionUserData(): Promise<IUserData | null> {
    try {
      log.debug('Fetching API access data from session endpoint (/api/user)');
      const { data } = await axios.get<IApiUserResponse>('/api/user');
      if (isValidToken(data.user)) {
        log.debug('Successfully fetched API access data from session, saving...');
        return data.user;
      }
    } catch (e) {
      log.error({ err: e }, 'Failed to fetch API access data from session endpoint');
    }
    return null;
  }

  /**
   * Attempts to refresh API access using server requests.
   *
   * @returns {Promise<IUserData | null>} Refreshed API access data or null if all attempts fail.
   */
  private async tryRefreshUserData(): Promise<IUserData | null> {
    try {
      log.debug('Refreshing API access data from API endpoint (/api/user)');
      const { data } = await axios.get<IApiUserResponse>('/api/user', {
        headers: { 'X-Refresh-Token': '1' },
      });
      if (isValidToken(data.user)) {
        log.debug('Successfully refreshed API access data, saving...');
        return data.user;
      }
    } catch (e) {
      log.error({ err: e }, 'Failed to refresh API access data from /api/user');
    }

    log.debug('Trying to refresh API access using bootstrap API');
    try {
      const { data } = await axios.get<IBootstrapPayload>(ApiTargets.BOOTSTRAP, defaultRequestConfig);
      const userData = pickUserData(data);
      if (isValidToken(userData)) {
        log.debug('Successfully refreshed API access using bootstrap, saving...');
        return userData;
      }
    } catch (e) {
      log.error({ err: e }, 'Failed to refresh API access using bootstrap');
    }
    return null;
  }

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  public setUserData(userData: IUserData) {
    if (isUserData(userData)) {
      this.userData = userData;
    }
  }

  private invalidateUserData() {
    updateAppUser(null);
    this.userData = null;
    this.udInvalidated = true;
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
    // serverside, we can just send the request
    if (typeof window === 'undefined') {
      return this.service.request<T>(applyTokenToRequest(config, this.userData?.access_token));
    }

    const cfgHash = this.hashConfig(config);
    if (this.pendingRequestsMap.has(cfgHash)) {
      return this.pendingRequestsMap.get(cfgHash) as Promise<AxiosResponse<T, unknown>>;
    }

    const request = new Promise<AxiosResponse<T>>((resolve, reject) => {
      this.getUserData()
        .then((ud) => {
          this.setUserData(ud);
          const cfg = applyTokenToRequest(config, ud.access_token);
          this.service
            .request<T>(cfg)
            .then(resolve)
            .catch((err) => {
              log.error({ err: err as AxiosError }, 'Request Error');
              reject(err);
            })
            .finally(() => {
              this.pendingRequestsMap.delete(cfgHash);
            });
        })
        .catch(reject);
    });
    this.pendingRequestsMap.set(cfgHash, request);
    return request;
  }

  private hashConfig = (config: ApiRequestConfig) => {
    return crypto.createHash('md5').update(JSON.stringify(config)).digest('hex');
  };

  public reset() {
    this.service = this.service = axios.create(defaultRequestConfig);
    void this.init();
    this.userData = null;
    this.udInvalidated = false;
    this.recentError = null;
    this.pendingRequestsMap = new Map();
  }
}

export default Api.getInstance();
