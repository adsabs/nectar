import {
  MutationFunction,
  MutationOptions,
  QueryFunction,
  useMutation,
  UseMutationOptions,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query';
import api, {
  ApiRequestConfig,
  ApiTargets,
  IADSApiUserDataParams,
  IADSApiUserDataResponse,
  IBasicAccountsResponse,
  IBootstrapPayload,
  IUserChangeEmailCredentials,
  IUserChangePasswordCredentials,
  IUserForgotPasswordCredentials,
  IUserRegistrationCredentials,
  IUserResetPasswordCredentials,
} from '@api';
import { configWithCSRF, isValidToken } from '@auth-utils';
import { defaultRequestConfig } from '@api/config';

export enum UserKeys {
  USER_API_TOKEN = 'user-api-token',
  USER_GENERATE_API_TOKEN = 'user-generate-api-token',
  REGISTER_USER = 'register-user',
  CHANGE_PASSWORD = 'change-password',
  CHANGE_EMAIL = 'change-email',
  GET_USER_SETTINGS = 'get-user-settings',
  UPDATE_USER_SETTINGS = 'update-user-settings',
  RESET_PASSWORD = 'reset-password',
  FORGOT_PASSWORD = 'forgot-password',
  DELETE_ACCOUNT = 'delete-account',
}

export const userKeys = {
  userApiToken: () => [UserKeys.USER_API_TOKEN],
  generateUserApiToken: () => [UserKeys.USER_GENERATE_API_TOKEN],
  registerUser: () => [UserKeys.REGISTER_USER],
  changePassword: () => [UserKeys.CHANGE_PASSWORD],
  changeEmail: () => [UserKeys.CHANGE_EMAIL],
  getUserSettings: () => [UserKeys.GET_USER_SETTINGS],
  updateUserSettings: () => [UserKeys.UPDATE_USER_SETTINGS],
  forgotPassword: () => [UserKeys.FORGOT_PASSWORD],
  resetPassword: () => [UserKeys.RESET_PASSWORD],
  deleteAccount: () => [UserKeys.DELETE_ACCOUNT],
};

export const fetchUserApiToken: QueryFunction<IBootstrapPayload> = async () => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.TOKEN,
  };

  const { data } = await api.request<IBootstrapPayload>(config);

  // in the case the user has yet to generate a token, generate an initial one
  if (data?.message === 'no ADS API client found') {
    const token = await generateUserApiToken({});
    if (isValidToken(token)) {
      return token;
    }
  }

  if (isValidToken(data)) {
    return data;
  }

  throw new Error('invalid-token');
};

const generateUserApiToken: MutationFunction<IBootstrapPayload> = async () => {
  const config = await configWithCSRF({
    method: 'PUT',
    url: ApiTargets.TOKEN,
  });

  const { data } = await api.request<IBootstrapPayload>(config);
  if (isValidToken(data)) {
    return data;
  }
  throw new Error('invalid-token');
};

const registerUser: MutationFunction<IBasicAccountsResponse, IUserRegistrationCredentials> = async (credentials) => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.REGISTER,
    data: {
      email: credentials.email,
      password1: credentials.password,
      password2: credentials.confirmPassword,
      'g-recaptcha-response': credentials.recaptcha,
    },
  });

  const { data } = await api.request<IBasicAccountsResponse>(config);
  if (data.message === 'success') {
    return data;
  }
  throw new Error('register-failed');
};

const changeUserPassword = async (credentials: IUserChangePasswordCredentials) => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.CHANGE_PASSWORD,
    data: {
      old_password: credentials.currentPassword,
      new_password1: credentials.password,
      new_password2: credentials.confirmPassword,
    },
  });

  const { data } = await api.request<IBasicAccountsResponse>(config);
  if (data.message === 'success') {
    return data;
  }
  throw new Error('change-password-failed');
};

const changeUserEmail = async (credentials: IUserChangeEmailCredentials) => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.CHANGE_EMAIL,
    data: credentials,
  });

  const { data } = await api.request<IBasicAccountsResponse>(config);
  if (data.message === 'success') {
    return data;
  }
  throw new Error('change-email-failed');
};

export const fetchUserSettings: QueryFunction<IADSApiUserDataResponse> = async () => {
  const config = {
    ...defaultRequestConfig,
    method: 'GET',
    url: ApiTargets.USER_DATA,
  };

  const { data } = await api.request<IADSApiUserDataResponse>(config);
  return data;
};

export const updateUserSettings: MutationFunction<IADSApiUserDataResponse, Partial<IADSApiUserDataParams>> = async (
  params,
) => {
  const config = {
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.USER_DATA,
    data: params,
  };

  const { data } = await api.request<IADSApiUserDataResponse>(config);
  return data;
};

export const forgotUserPassword: MutationFunction<IBasicAccountsResponse, IUserForgotPasswordCredentials> = async (
  credentials,
) => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'POST',
    url: `${ApiTargets.RESET_PASSWORD}/${credentials.email}`,
    data: {
      'g-recaptcha-response': credentials.recaptcha,
    },
  });

  const { data } = await api.request<IBasicAccountsResponse>(config);
  if (data.message === 'success') {
    return data;
  }
  throw new Error('forgot-password-failed');
};

const resetUserPassword: MutationFunction<IBasicAccountsResponse, IUserResetPasswordCredentials> = async (
  credentials,
) => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'PUT',
    url: `${ApiTargets.RESET_PASSWORD}/${credentials.verifyToken}`,
    data: {
      password1: credentials.password,
      password2: credentials.confirmPassword,
    },
  });

  const { data } = await api.request<IBasicAccountsResponse>(config);
  if (data.message === 'success') {
    return data;
  }
  throw new Error('reset-password-failed');
};

export const deleteUserAccount: MutationFunction<IBasicAccountsResponse, unknown> = async () => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.DELETE,
  });

  const { data } = await api.request<IBasicAccountsResponse>(config);
  if (data.message === 'success') {
    return data;
  }
  throw new Error('delete-account-failed');
};

export const useGetUserApiToken = (options?: UseQueryOptions<IBootstrapPayload>) => {
  return useQuery({
    queryKey: userKeys.userApiToken(),
    queryFn: fetchUserApiToken,
    ...options,
  });
};

export const useGenerateNewApiToken = (options?: MutationOptions<string | IBootstrapPayload>) => {
  return useMutation({
    mutationKey: userKeys.generateUserApiToken(),
    mutationFn: generateUserApiToken,
    ...options,
  });
};

export const useRegisterUser = (
  options?: UseMutationOptions<IBasicAccountsResponse, unknown, IUserRegistrationCredentials>,
) => {
  return useMutation({
    mutationKey: userKeys.registerUser(),
    mutationFn: registerUser,
    ...options,
  });
};

export const useChangeUserPassword = (
  options?: UseMutationOptions<IBasicAccountsResponse, unknown, IUserChangePasswordCredentials>,
) => {
  return useMutation({
    mutationKey: userKeys.changePassword(),
    mutationFn: changeUserPassword,
    ...options,
  });
};

export const useChangeUserEmail = (
  options?: UseMutationOptions<IBasicAccountsResponse, unknown, IUserChangeEmailCredentials>,
) => {
  return useMutation({
    mutationKey: userKeys.changeEmail(),
    mutationFn: changeUserEmail,
    ...options,
  });
};

export const useGetUserSettings = (options?: UseQueryOptions<IADSApiUserDataResponse>) => {
  return useQuery({
    queryKey: userKeys.getUserSettings(),
    queryFn: fetchUserSettings,
    ...options,
  });
};

export const useUpdateUserSettings = (
  options?: UseMutationOptions<IADSApiUserDataResponse, unknown, Partial<IADSApiUserDataParams>>,
) => {
  return useMutation({
    mutationKey: userKeys.updateUserSettings(),
    mutationFn: updateUserSettings,
    ...options,
  });
};

export const useForgotPassword = (
  options?: UseMutationOptions<IBasicAccountsResponse, unknown, IUserForgotPasswordCredentials>,
) => {
  return useMutation({
    mutationKey: userKeys.forgotPassword(),
    mutationFn: forgotUserPassword,
    ...options,
  });
};

export const useResetPassword = (
  options?: UseMutationOptions<IBasicAccountsResponse, unknown, IUserResetPasswordCredentials>,
) => {
  return useMutation({
    mutationKey: userKeys.resetPassword(),
    mutationFn: resetUserPassword,
    ...options,
  });
};

export const useDeleteAccount = (options?: UseMutationOptions<IBasicAccountsResponse, unknown, unknown>) => {
  return useMutation({
    mutationKey: userKeys.deleteAccount(),
    mutationFn: deleteUserAccount,
    ...options,
  });
};
