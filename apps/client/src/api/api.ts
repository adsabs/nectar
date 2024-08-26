import { createStandaloneToast, CreateStandaloneToastReturn } from '@chakra-ui/react';
import type { NectarSessionResponse, ScixUser } from '@server/types';
import { to as toReq } from 'await-to-js';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { __, all, allPass, complement, identity, includes, is, isEmpty, propSatisfies } from 'ramda';

import { logger } from '@/logger';
import { theme } from '@/theme';

import { defaultRequestConfig } from './config';

export type ApiRequestConfig = AxiosRequestConfig;

const log = logger.child({}, { msgPrefix: '[api] ' });
const to = async <T = unknown>(promise: Promise<AxiosResponse<T>>) => toReq<AxiosResponse<T>, AxiosError<T>>(promise);

class SessionManager {
  private static SESSION_ENDPOINT = '/api/auth/session';
  private static REFRESH_ENDPOINT = '/api/auth/refresh';
  private user: ScixUser | null;
  private errors: ErrorManager;
  private tokenPromise: Promise<string | null> | null = null; // To track ongoing token request
  private retryCount = 0; // Track the number of retries

  constructor() {
    this.user = null;
    this.errors = new ErrorManager();
  }

  private validateSession() {
    return allPass([
      is(Object),
      propSatisfies(is(String), 'expire'),
      propSatisfies(complement(isEmpty), 'expire'),
      propSatisfies(is(String), 'token'),
      propSatisfies(complement(isEmpty), 'token'),
      propSatisfies(is(String), 'name'),
      propSatisfies(is(Array), 'permissions'),
      propSatisfies(all(is(String)), 'permissions'),
      propSatisfies(includes(__, ['anonymous', 'user']), 'role'),
    ])(this.user);
  }

  private setUser(user: ScixUser) {
    this.user = user;
  }

  // Helper to reset the tokenPromise and retry count
  private resetTokenPromise() {
    this.tokenPromise = null;
    this.retryCount = 0;
  }

  // Main method to get session token with queuing
  async getSessionToken(): Promise<string | null> {
    log.debug('Getting session token');

    // If a tokenPromise is in progress, return it
    if (this.tokenPromise instanceof Promise) {
      return this.tokenPromise;
    }

    // Create a new tokenPromise and assign it
    this.tokenPromise = new Promise((resolve, reject) => {
      (async () => {
        if (this.user && this.user.token.length > 0) {
          log.debug('Using existing session token');
          resolve(this.user.token);
          this.resetTokenPromise();
          return;
        }

        const [err, res] = await to(
          axios.get<NectarSessionResponse>(SessionManager.SESSION_ENDPOINT, {
            withCredentials: true,
          }),
        );

        if (err) {
          this.handleError(err, reject);
        } else if (res) {
          log.debug('Session token retrieved successfully');
          this.setUser(res.data.user);
          resolve(res.data.user.token);
        } else {
          reject('Unable to authorize request to API');
        }

        this.resetTokenPromise();
      })();
    });

    return this.tokenPromise;
  }

  async refreshSessionToken(): Promise<string | null> {
    log.debug('Refreshing session token');

    // If a tokenPromise is in progress, return it
    if (this.tokenPromise instanceof Promise) {
      return this.tokenPromise;
    }

    // Create a new tokenPromise and assign it
    this.tokenPromise = new Promise((resolve, reject) => {
      (async () => {
        const [err, res] = await to(
          axios.get<{ user: ScixUser }>(SessionManager.REFRESH_ENDPOINT, { withCredentials: true }),
        );

        if (err) {
          this.handleError(err, reject);
        } else if (res) {
          log.debug('Session token refreshed successfully');
          this.setUser(res.data.user);
          resolve(res.data.user.token);
        } else {
          reject('Unable to refresh session');
        }

        this.resetTokenPromise();
      })();
    });

    return this.tokenPromise;
  }

  // Centralized error handling
  private handleError(err: AxiosError, reject: (reason?: any) => void) {
    if (err.response?.status === 401) {
      log.error('Session may have expired, triggering refresh');
      this.errors.emit({ err, type: 'error' }, 'Your session may have expired, please refresh this page');
      reject('Session may have expired');
    } else if (err.response?.status === 429) {
      log.error('Too many requests, throttling');
      this.errors.emit({ err, type: 'error' }, 'Too many requests, please wait a minute and try again');
      reject('Too many requests');
    } else {
      log.error('Error contacting server');
      this.errors.emit(
        { err: err as Error, type: 'error' },
        'Having trouble contacting server, search and other features may not work properly',
      );
      reject('Having trouble contacting server');
    }
  }
}

class ErrorManager {
  private id = 'api-toast';
  private toastInstance: CreateStandaloneToastReturn;
  constructor() {
    this.toastInstance = createStandaloneToast({
      theme,
      defaultOptions: {
        duration: 5000,
        status: 'info',
        position: 'bottom',
        id: this.id,
      },
    });
  }
  emit({ err, type }: { err: Error; type: 'info' | 'error' }, msg = 'API Error') {
    log.error({ err, type }, msg);
    if (type === 'error') {
      this.toastInstance.toast({
        title: 'API Error',
        description: msg,
        status: 'error',
      });
    } else if (type === 'info') {
      this.toastInstance.toast({
        title: 'API Info',
        description: msg,
        status: 'info',
      });
    }
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
    this.service.interceptors.response.use(identity, this.handleErrorResponse.bind(this));
  }

  public async request<T = unknown>(config: ApiRequestConfig) {
    log.debug('Starting API request', { config });
    await this.session.getSessionToken(); // Ensure we have a valid token
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
      if (this.session.retryCount > 1) {
        // Check if we've already retried once
        log.error('Retry limit reached, not retrying');
        return Promise.reject('Retry limit reached, unable to authorize request');
      }

      this.errors.emit({ err, type: 'info' }, 'Got unauthorized reply when fetching from the API');
      this.session.retryCount++; // Increment retry count

      const token = await this.session.refreshSessionToken();

      if (!token) {
        log.error({ token }, 'No token after refresh, stopping request');
        return Promise.reject('Unable to authorize request to API');
      }

      log.debug('Retrying original request with new token', { originalConfig: err.config });
      return this.service.request(err.config as ApiRequestConfig);
    }

    if (err.response?.status === 429) {
      log.error('Too many requests, please wait before retrying');
      this.errors.emit({ err, type: 'error' }, 'Too many requests, please wait a minute and try again');
      return Promise.reject(err);
    }

    log.error('Unhandled API error', { err });
    return Promise.reject(err);
  }

  // Singleton: Provides global access to the instance
  public static getInstance(): Api {
    if (!this.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }
}

export default Api.getInstance();
