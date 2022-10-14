import { AppRuntimeConfig } from '@types';
import { AxiosRequestConfig } from 'axios';
import { PathLike } from 'fs';
import getConfig from 'next/config';
import qs from 'qs';

/**
 * Figure out which config to pick, based on the current environment
 */
const resolveApiBaseUrl = (defaultBaseUrl = ''): string => {
  // for mocking requests, just shortcut the baseURL here
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    return 'http://localhost';
  }

  const config = getConfig() as AppRuntimeConfig;

  if (typeof config === 'undefined') {
    return defaultBaseUrl;
  }

  const configType = typeof window === 'undefined' ? 'serverRuntimeConfig' : 'publicRuntimeConfig';
  return config[configType]?.apiHost ?? defaultBaseUrl;
};

export const defaultRequestConfig: AxiosRequestConfig = {
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: 30000,
  paramsSerializer: (params: PathLike) =>
    qs.stringify(params, {
      indices: false,
      arrayFormat: 'repeat',
      format: 'RFC1738',
      sort: (a, b) => a - b,
      skipNulls: true,
    }),
  headers: {
    common: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
  },
};
