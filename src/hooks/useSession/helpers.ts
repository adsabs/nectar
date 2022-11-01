import api, {
  ApiTargets,
  IBasicAccountsErrorResponse,
  IBasicAccountsResponse,
  IBootstrapPayload,
  ICSRFResponse,
  IUserData,
} from '@api';
import { defaultRequestConfig } from '@api/config';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { NextApiResponse } from 'next';
import { pick } from 'ramda';
import { IUserCredentials, IUserRegistrationCredentials } from './types';

interface ResponseWithCookie<T> extends AxiosResponse<T> {
  headers: {
    'set-cookie': string;
  };
}

export const getCSRF = async () => {
  const res = await axios.get<ICSRFResponse, ResponseWithCookie<ICSRFResponse>>(ApiTargets.CSRF, defaultRequestConfig);
  return res;
};

export const authenticateUser = async (creds: IUserCredentials, res?: NextApiResponse) => {
  const csrfRes = await getCSRF();

  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.USER,
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
    data: {
      username: creds.email,
      password: creds.password,
    },
  };

  try {
    const { data, headers } = await axios.request<IBasicAccountsResponse, ResponseWithCookie<IBasicAccountsResponse>>(
      config,
    );

    if (data.message === 'success') {
      // forward the set-cookie so that subsequent bootstraps will work client-side
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        const userData = await bootstrap({ session: headers['set-cookie'] }, res);

        return userData;
      } catch (e) {
        // if bootstrap fails here, we can recover later in a subsequent request
        return true;
      }
    }

    return false;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return (e.response.data as IBasicAccountsErrorResponse).error;
    }
    return 'Unknown server error';
  }
};

export const registerUser = async (creds: IUserRegistrationCredentials) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.REGISTER,
    data: {
      email: creds.email,
      password1: creds.password,
      password2: creds.confirmPassword,
      'g-recaptcha-response': creds.recaptcha,
    },
  };
  try {
    const { data } = await axios.request<IBasicAccountsResponse>(config);
    return data.message === 'success';
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return (e.response.data as IBasicAccountsErrorResponse).error;
    }
    return 'Unknown server error';
  }
};

export const logoutUser = async (res?: NextApiResponse) => {
  const csrfRef = await getCSRF();

  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.LOGOUT,
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
      'X-CSRFToken': csrfRef.data.csrf,
      Cookie: csrfRef.headers['set-cookie'],
    },
  };

  try {
    const { data, headers } = await axios.request<IBasicAccountsResponse, ResponseWithCookie<IBasicAccountsResponse>>(
      config,
    );

    if (data.message === 'success') {
      // forward the set-cookie so that subsequent bootstraps will work client-side
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        const userData = await bootstrap({ session: headers['set-cookie'] }, res);

        return userData;
      } catch (e) {
        // if bootstrap fails here, we can recover later in a subsequent request
        return true;
      }
    }

    return false;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return (e.response.data as IBasicAccountsErrorResponse).error;
    }
    return 'Unknown server error';
  }
};

export const getVaultData = async () => {
  try {
    const { data } = await api.request<Record<string, unknown>>({ url: ApiTargets.USER_DATA });
    return data;
  } catch (e) {
    return null;
  }
};

export const bootstrap = async ({ session }: { session: string }, res?: NextApiResponse) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'GET',
    url: ApiTargets.BOOTSTRAP,
    headers: {
      Cookie: session,
    },
  };

  const { data, headers } = await axios.request<IBootstrapPayload, ResponseWithCookie<IBootstrapPayload>>(config);

  // server-side this should forward the incoming set-cookie value
  if (res) {
    res.setHeader('set-cookie', headers['set-cookie']);
  }

  return pick(['access_token', 'username', 'anonymous', 'expire_in'], data) as IUserData;
};
