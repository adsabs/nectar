import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiRequestConfig, ApiTargets, IBootstrapPayload, ICSRFResponse, IUserData } from '@/api';
import { defaultRequestConfig } from '@/api/config';
import { isNil } from 'ramda';
import { APP_DEFAULTS } from '@/config';
import { logger } from '@/logger';

const fetchCSRF = async () => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    url: ApiTargets.CSRF,
    timeout: APP_DEFAULTS.API_TIMEOUT,
  };
  logger.debug({ config }, 'Fetching CSRF token');
  return axios.request<ICSRFResponse, AxiosResponse<ICSRFResponse>>(config);
};

export const configWithCSRF = async (config: ApiRequestConfig): Promise<ApiRequestConfig> => {
  const csrfRes = await fetchCSRF();
  return {
    ...config,
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
      ...config.headers,
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
  };
};

/**
 * Fetches the user data from the server
 *
 * i.e. Bootstrap
 */
export const fetchUserData = async (additionalConfig?: AxiosRequestConfig) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    ...additionalConfig,
    method: 'GET',
    url: ApiTargets.BOOTSTRAP,
    timeout: APP_DEFAULTS.API_TIMEOUT,
  };

  return await axios.request<IBootstrapPayload, AxiosResponse<IBootstrapPayload>>(config);
};

/**
 * Hashes a string using SHA-1
 * @param str
 */
export const hash = async (str?: string) => {
  if (!str) {
    return null;
  }
  try {
    const buffer = await globalThis.crypto.subtle.digest('SHA-1', Buffer.from(str, 'utf-8'));
    return Array.from(new Uint8Array(buffer)).toString();
  } catch (e) {
    return null;
  }
};

/**
 * Checks if the user data is valid
 * @param userData
 */
export const isUserData = (userData?: IUserData): userData is IUserData =>
  !isNil(userData) &&
  typeof userData.access_token === 'string' &&
  typeof userData.expires_at === 'string' &&
  userData.access_token.length > 0 &&
  userData.expires_at.length > 0;

/**
 * Checks if a token is expired based on the expiration time.
 *
 * @param {string} expiresAt - The expiration time of the token in seconds since the Unix epoch.
 * @returns {boolean} - Returns true if the current time is greater than or equal to the expiration time, false otherwise.
 */
export const isTokenExpired = (expiresAt: string): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  const tokenExpiryTime = parseInt(expiresAt, 10);
  return currentTime >= tokenExpiryTime;
};

/**
 * Checks if the token is valid
 * @param userData
 */
export const isValidToken = (userData?: IUserData): boolean =>
  isUserData(userData) && !isTokenExpired(userData.expires_at);

/**
 * Checks if the user is authenticated
 * @param user
 */
export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

/**
 * Picks the user data from the bootstrap payload
 * @param userData
 */
export const pickUserData = (userData?: IUserData | IBootstrapPayload) => {
  if (!isUserData(userData)) {
    return null;
  }
  return {
    access_token: userData.access_token,
    expires_at: userData.expires_at,
    username: userData.username,
    anonymous: userData.anonymous,
  };
};
