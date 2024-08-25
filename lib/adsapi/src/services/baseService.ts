import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { APIError, APIResponse, RequestOptions, ServiceConfig } from '../types';

export abstract class BaseService<TResponse = unknown> {
  protected axiosInstance: AxiosInstance;
  protected config: ServiceConfig;

  protected constructor(config: ServiceConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
    });
  }

  protected async request<T = TResponse>(options: RequestOptions): Promise<APIResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.axiosInstance.request<T>({
        method: options.method,
        url: options.url,
        params: options.params,
        data: options.data,
      });
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.message,
          status: error.response?.status ?? 500,
          data: error.response?.data,
        } as APIError;
      }
      throw error;
    }
  }
}
