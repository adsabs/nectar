import { IUserData } from '@api';
import { APP_STORAGE_KEY, updateAppUser } from '@store';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isPast, parseISO } from 'date-fns';
import { identity, isNil, pick } from 'ramda';
import { IBootstrapPayload } from './accounts';
import { defaultRequestConfig } from './config';
import { ApiTargets } from './models';

export const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

const checkUserData = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isPast(parseISO(userData.expire_in));
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
 * Apply a bearer token string to the request's headers
 * returns a new request config with authorization header added
 */
const applyTokenToRequest = (request: ApiRequestConfig, token: string) => {
  return {
    ...request,
    headers: {
      ...request.headers,
      authorization: `Bearer:${token}`,
    },
  };
};

export interface ApiRequestConfig extends AxiosRequestConfig {
  headers?: { authorization?: string };
}

enum API_STATUS {
  UNAUTHORIZED = 401,
}

/**
 * Api structure that wraps the axios instance
 * This allows us to manage the setting/resetting of the token
 * and to persist a particular instance over multiple requests
 */
class Api {
  private static instance: Api;
  private service: AxiosInstance;
  private userData: IUserData;
  private recentError: { status: number; config: AxiosRequestConfig };

  private constructor() {
    this.service = axios.create(defaultRequestConfig);
    this.init();
  }

  private init() {
    this.service.interceptors.response.use(identity, (error: AxiosError & { canRefresh: boolean }) => {
      if (axios.isAxiosError(error)) {
        // if the server never responded, there won't be a response object -- in that case, reject immediately
        if (!error.response) {
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
          return Promise.reject(error);
        }

        // if request is NOT bootstrap, store error config
        if (error.config.url !== ApiTargets.BOOTSTRAP) {
          this.recentError = { status: error.response.status, config: error.config };
        }

        if (error.response.status === API_STATUS.UNAUTHORIZED) {
          this.invalidateUserData();
          return this.bootstrap()
            .then((res) => {
              this.setUserData(res);
              updateAppUser(res);
              return this.request(error.config as ApiRequestConfig);
            })
            .catch(() => {
              const bootstrapError = new Error('Unrecoverable Error, unable to refresh token', { cause: error });
              return Promise.reject(bootstrapError);
            });
        }
      }
      return Promise.reject(error);
    });
  }

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  public setUserData(userData: IUserData) {
    this.userData = userData;
  }

  private invalidateUserData() {
    updateAppUser(null);
    this.setUserData(null);
  }

  /**
   * Main request method
   * Authenticate and fire the request
   */
  async request<T>(config: ApiRequestConfig): Promise<AxiosResponse<T>> {
    // we have valid token, send the request right away
    if (checkUserData(this.userData)) {
      return this.service.request<T>(applyTokenToRequest(config, this.userData.access_token));
    }

    // otherwise attempt to get the token from local storage
    const userData = getUserData();
    if (checkUserData(userData)) {
      // set user data property
      this.setUserData(userData);

      return this.service.request<T>(applyTokenToRequest(config, userData.access_token));
    }

    // finally, we have to attempt a bootstrap request
    try {
      const freshUserData = await this.bootstrap();

      // set user data property and in the app store
      this.setUserData(freshUserData);
      updateAppUser(freshUserData);
      return this.service.request<T>(applyTokenToRequest(config, freshUserData.access_token));
    } catch (e) {
      // bootstrapping failed all attempts, let user know
      const bootstrapError = new Error('Unrecoverable Error, unable to refresh token', { cause: e as Error });
      return Promise.reject(bootstrapError);
    }
  }

  /**
   * Fetch latest user data, retries after errors
   */
  async bootstrap() {
    const { data } = await this.retry<Promise<AxiosResponse<IBootstrapPayload>>>(
      {
        ...defaultRequestConfig,
        method: 'GET',
        url: ApiTargets.BOOTSTRAP,
      },
      {
        interval: process.env.NODE_ENV === 'test' ? 0 : undefined,
      },
    );

    return pick(['access_token', 'username', 'expire_in', 'anonymous'], data) as IUserData;
  }

  /**
   * Simple retryer, will rerun request after delay
   */
  async retry<T>(
    config: AxiosRequestConfig,
    options: {
      retries?: number;
      interval?: number;
    } = {},
  ): Promise<T> {
    const { retries = 3, interval = 1000 } = options;
    try {
      // await promise
      return await axios.request(config);
    } catch (error) {
      if (retries) {
        // delay
        await new Promise((_) => setTimeout(_, interval));

        // recursive retry
        return this.retry(config, { ...options, retries: retries - 1 });
      } else {
        // out of retries, throw error
        throw new Error(`Max retries reached.`);
      }
    }
  }

  public reset() {
    this.service = this.service = axios.create(defaultRequestConfig);
    this.init();
    this.userData = null;
    this.recentError = null;
  }
}

export default Api.getInstance();
