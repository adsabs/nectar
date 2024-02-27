import { AppRuntimeConfig } from '@types';
import { AxiosRequestConfig } from 'axios';
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

  // use a known URL for development
  if (process.env.NODE_ENV === 'development' && typeof process.env.NEXT_PUBLIC_API_HOST_CLIENT === 'string') {
    return process.env.NEXT_PUBLIC_API_HOST_CLIENT;
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
  paramsSerializer: {
    serialize: (params) =>
      qs.stringify(params, {
        indices: false,
        arrayFormat: 'repeat',
        format: 'RFC1738',
        sort: (a, b) => a - b,
        skipNulls: true,
      }),
  },
};

export const getDynamicConfig = () => {
  return {
    ...defaultRequestConfig,
    baseURL: resolveApiBaseUrl(),
  };
};
