import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as AxiosLogger from 'axios-logger';
import type { RequestLogConfig } from 'axios-logger/lib/common/types';
import { PathLike } from 'fs';
import qs from 'qs';
import { mergeDeepLeft } from 'ramda';

export interface IServiceConfig extends AxiosRequestConfig {
  debug?: boolean;
}

const baseConfig: IServiceConfig = {
  baseURL: process.env.API_HOST,
  withCredentials: true,
  timeout: 30000,
  paramsSerializer: (params: PathLike) =>
    qs.stringify(params, { indices: false }),
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
  prefixText: 'ADS API'
};

type MDL = <T>(ob1: T, obj2: T) => T;

export class Service {
  private service: AxiosInstance;

  constructor(config?: IServiceConfig) {

    // recursively merge configurations
    const cfg = (mergeDeepLeft as MDL)(config, baseConfig) || {};
    this.service = axios.create(cfg);

    if (cfg.debug) {
      this.service.interceptors.request.use((request: AxiosRequestConfig) => {
        return AxiosLogger.requestLogger(request, loggerConfig);
      });
    }
  }

  protected request<T, E = unknown>(config?: AxiosRequestConfig): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.service
        .request<T>(config || {})
        .then((response) => {
          resolve(response.data);
        })
        .catch((response: E) => {
          reject(response);
        });
    });
  }
}
