import api, {
  ApiTargets,
  IADSApiTokenResponse,
  IADSApiUserDataResponse,
  IBasicAccountsErrorResponse,
  IBasicAccountsResponse,
  IBootstrapPayload,
  ICSRFResponse,
  IUserChangeEmailCredentials,
  IUserChangePasswordCredentials,
  IUserData,
} from '@api';
import { defaultRequestConfig } from '@api/config';
import { IUserCredentials, IUserForgotPasswordCredentials, IUserRegistrationCredentials } from '@api/user';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { NextApiResponse } from 'next';
import { ServerResponse } from 'node:http';
import { pick } from 'ramda';

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
    const { data, headers } = await axios.request<IBasicAccountsResponse, AxiosResponse<IBasicAccountsResponse>>(
      config,
    );

    if (data.message === 'success') {
      // forward the set-cookie so that subsequent bootstraps will work client-side
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        return await bootstrap({ session: headers['set-cookie'][0] }, res);
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
    const { data, headers } = await axios.request<IBasicAccountsResponse, AxiosResponse<IBasicAccountsResponse>>(
      config,
    );

    if (data.message === 'success') {
      // forward the set-cookie so that subsequent bootstraps will work client-side
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        return await bootstrap({ session: headers['set-cookie'][0] }, res);
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
  const csrfRes = await getCSRF();

  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.REGISTER,
    headers: {
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
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

export const forgotPasswordUser = async (creds: IUserForgotPasswordCredentials) => {
  const csrfRes = await getCSRF();

  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'POST',
    url: `${ApiTargets.RESET_PASSWORD}/${creds.email}`,
    headers: {
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
    data: {
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

export const changePasswordUser = async (creds: IUserChangePasswordCredentials) => {
  const csrfRes = await getCSRF();

  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'POST',
    url: `${ApiTargets.CHANGE_PASSWORD}`,
    headers: {
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
    data: {
      old_password: creds.currentPassword,
      new_password1: creds.password,
      new_password2: creds.confirmPassword,
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

export const changeEmailUser = async (creds: IUserChangeEmailCredentials) => {
  const csrfRes = await getCSRF();

  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    headers: {
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
    method: 'POST',
    url: `${ApiTargets.CHANGE_EMAIL}`,
    data: creds,
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

export const getResetPasswordVerifyEmail = async (token: string) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'GET',
    url: `${ApiTargets.RESET_PASSWORD}/${token}`,
  };
  try {
    const { data } = await axios.request<{ email: string }>(config);
    return data.email;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return (e.response.data as IBasicAccountsErrorResponse).error;
    }
    return 'Unknown server error';
  }
};

export const verifyAccount = async (token: string, res?: ServerResponse) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'GET',
    url: `${ApiTargets.VERIFY}/${token}`,
  };
  try {
    const { data, headers } = await axios.request<IBasicAccountsResponse & { email: string }>(config);

    if (data.message === 'success') {
      // forward the set-cookie so that subsequent bootstraps will work client-side
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        return await bootstrap({ session: headers['set-cookie'][0] }, res);
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

export const generateNewApiToken = async () => {
  const csrfRes = await getCSRF();

  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'PUT',
    url: `${ApiTargets.TOKEN}`,
    headers: {
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
  };
  try {
    const { data } = await axios.request<IADSApiTokenResponse>(config);
    return data;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return (e.response.data as IBasicAccountsErrorResponse).error;
    }
    return 'Unknown server error';
  }
};

export const getVaultData = async () => {
  try {
    const { data } = await api.request<IADSApiUserDataResponse>({ url: ApiTargets.USER_DATA });
    return data;
  } catch (e) {
    return null;
  }
};

export const bootstrap = async ({ session }: { session: string }, res?: NextApiResponse | ServerResponse) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    method: 'GET',
    url: ApiTargets.BOOTSTRAP,
    headers: {
      Cookie: session,
    },
  };

  const { data, headers } = await axios.request<IBootstrapPayload, AxiosResponse<IBootstrapPayload>>(config);

  // server-side this should forward the incoming set-cookie value
  if (res) {
    res.setHeader('set-cookie', headers['set-cookie']);
  }

  return pick(['access_token', 'username', 'anonymous', 'expire_in'], data) as IUserData;
};

export const getCSRF = async () =>
  await axios.get<ICSRFResponse, AxiosResponse<ICSRFResponse>>(ApiTargets.CSRF, defaultRequestConfig);
