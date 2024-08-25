import { AxiosRequestConfig, AxiosResponse } from 'axios';

export type APIResponse<T> = {
  data: T;
  status: number;
  headers: AxiosResponse['headers'];
};

export type APIError = {
  message: string;
  status: number;
  data?: unknown;
};

export type ServiceConfig = {
  baseURL: string;
};

export type RequestOptions = AxiosRequestConfig;
