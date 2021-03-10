import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PathLike } from 'fs';
import qs from 'qs';
import { mergeDeepLeft } from 'ramda';

const baseConfig: AxiosRequestConfig = {
  baseURL: 'https://devapi.adsabs.harvard.edu/v1',
  withCredentials: true,
  timeout: 30000,
  paramsSerializer: (params: PathLike) =>
    qs.stringify(params, { indices: false }),
  headers: {
    common: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Bearer:nygCEUOLMpBgsSw5tcWOzg1neANMaxqkfrHRXu59',
    },
  },
};

type MDL = <T>(ob1: T, obj2: T) => T;

export class Service {
  private service: AxiosInstance;

  constructor(config?: AxiosRequestConfig) {
    // recursively merge configurations
    const cfg = (mergeDeepLeft as MDL)(config, baseConfig);
    this.service = axios.create(cfg);
    // this.service.interceptors.response.use(
    //   this.handleSuccess.bind(this),
    //   this.handleError.bind(this),
    // );
  }

  request<T, E = unknown>(config?: AxiosRequestConfig): Promise<T> {
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
