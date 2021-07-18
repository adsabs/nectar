import { AppRuntimeConfig } from '@types';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as AxiosLogger from 'axios-logger';
import { RequestLogConfig } from 'axios-logger/lib/common/types';
import { PathLike } from 'fs';
import { err, ok, Result } from 'neverthrow';
import getConfig from 'next/config';
import qs from 'qs';
import { mergeDeepLeft } from 'ramda';

export interface IServiceConfig extends AxiosRequestConfig {
  debug?: boolean;
  token?: string;
}

const {
  publicRuntimeConfig: { apiHost },
} = getConfig() as AppRuntimeConfig;

const baseConfig: IServiceConfig = {
  token: undefined,
  baseURL: apiHost,
  withCredentials: true,
  timeout: 30000,
  paramsSerializer: (params: PathLike) => qs.stringify(params, { indices: false }),
  headers: {
    common: {
      // 'Cache-Control': 'no-cache, no-store, must-revalidate',
      // 'Content-Type': 'application/json',
      // Accept: 'application/json',
    },
  },
  debug: true,
};

const loggerConfig: RequestLogConfig = {
  data: true,
  prefixText: 'ADS API',
};

type MDL = <T>(ob1: T, obj2: T) => T;

export class Service {
  private service: AxiosInstance;

  constructor(config: IServiceConfig) {
    // recursively merge configurations
    const { token, debug, ...cfg } = (mergeDeepLeft as MDL)(config, baseConfig) || {};
    this.service = axios.create(cfg);

    this.service.interceptors.request.use((request: AxiosRequestConfig) => {
      if (typeof token === 'string') {
        (request.headers as { authorization: string })['authorization'] = `Bearer:${token}`;
      }
      return request;
    });

    if (debug) {
      this.service.interceptors.request.use((request: AxiosRequestConfig) => {
        return AxiosLogger.requestLogger(request, loggerConfig);
      });
    }
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
