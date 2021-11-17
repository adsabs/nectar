import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import * as AxiosLogger from 'axios-logger';
import { RequestLogConfig } from 'axios-logger/lib/common/types';
import { PathLike } from 'fs';
import { err, ok, Result } from 'neverthrow';
import qs from 'qs';
import { identity, mergeDeepLeft } from 'ramda';
import { ApiTargets } from './models';
import { injectAuth, resolveApiBaseUrl } from './utils';

export interface IServiceConfig extends AxiosRequestConfig {
  debug?: boolean;
  token?: string;
}

export const baseConfig: IServiceConfig = {
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
  debug: process.env.NODE_ENV === 'development',
};

const loggerConfig: RequestLogConfig = {
  data: true,
  prefixText: 'ADS API',
};

type MDL = <T>(ob1: T, obj2: T) => T;

export class Service {
  private service: AxiosInstance;
  private latestRequest: AxiosRequestConfig;

  constructor(config: IServiceConfig) {
    // recursively merge configurations
    const { debug, token, ...cfg } = (mergeDeepLeft as MDL)(config, baseConfig);
    this.service = axios.create(cfg);

    const injectToken = async (request: AxiosRequestConfig) => {
      // will use passed-in token, if it was done server-side
      if (typeof token === 'string' && token.length > 0 && typeof window === 'undefined') {
        (request.headers as { authorization: string })['authorization'] = `Bearer:${token}`;
        return request;
      }

      if (request.url === ApiTargets.BOOTSTRAP) {
        // if the request is to bootstrap, don't re-check token
        return request;
      }
      const requestWithAuth = await injectAuth(request);
      this.latestRequest = requestWithAuth;
      return requestWithAuth;
    };

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

    this.service.interceptors.response.use(identity, handleResponseError);
    this.service.interceptors.request.use(injectToken);

    if (debug) {
      this.service.interceptors.request.use((request: AxiosRequestConfig) => {
        return AxiosLogger.requestLogger(request, loggerConfig);
      });
    }
  }

  public getAxiosInstance(): AxiosInstance {
    return this.service;
  }

  protected async request<T>(config: AxiosRequestConfig = {}): Promise<Result<T, Error>> {
    try {
      const { data } = await this.service.request<T>(config);
      return ok(data);
    } catch (e) {
      return err(e || 'API Request Error');
    }
  }
}
