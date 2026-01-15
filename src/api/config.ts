import { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { APP_DEFAULTS } from '@/config';

/**
 * Resolve API base URL from environment variables.
 * Server-side uses API_HOST_SERVER, client-side uses NEXT_PUBLIC_API_HOST_CLIENT.
 */
const resolveApiBaseUrl = (defaultBaseUrl = ''): string => {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    return 'http://localhost';
  }

  if (typeof window === 'undefined') {
    return process.env.API_HOST_SERVER ?? defaultBaseUrl;
  }

  return process.env.NEXT_PUBLIC_API_HOST_CLIENT ?? defaultBaseUrl;
};

export const defaultRequestConfig: AxiosRequestConfig = {
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },

  timeout: typeof window === 'undefined' ? APP_DEFAULTS.SSR_API_TIMEOUT : APP_DEFAULTS.API_TIMEOUT,
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
