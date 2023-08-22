export interface IADSApiUserResponse {
  [key: string]: unknown;
}

export interface IADSApiUserErrorResponse {
  [key: string]: unknown;
}

export interface IRegisterParams {
  email: string;
  errorMsg: string;
  hasError: boolean;
  password1: string;
  password2: string;
  verify_url: string;
  'g-recaptcha-response': string;
}

export interface IBasicAccountsResponse {
  message: string;
}

export interface IBasicAccountsErrorResponse {
  error: string;
}

export interface ICSRFResponse {
  csrf: string;
}

export interface IBootstrapPayload {
  username: string;
  scopes: string[];
  client_id: string;
  access_token: string;
  client_name: string;
  token_type: string;
  ratelimit: number;
  anonymous: boolean;
  client_secret: string;
  expire_in: string;
  refresh_token: string;
  message?: string;
}

export type IUserData = Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expire_in'>;

export interface IUserForgotPasswordCredentials {
  email: string;
  recaptcha: string;
}

export interface IUserCredentials {
  email: string;
  password: string;
}

export interface IUserRegistrationCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  recaptcha: string;
}

export interface IAuthLoginResponse {
  success: boolean;
  user?: IUserData;
  error?: string;
}

export interface IUserForgotPasswordCredentials {
  email: string;
  recaptcha: string;
}

export interface IUserChangePasswordCredentials {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export interface IUserChangeEmailCredentials {
  email: string;
  password: string;
}

export interface IUserResetPasswordCredentials {
  password: string;
  confirmPassword: string;
  verifyToken: string;
}

// VERIFY typings
export interface IVerifyAccountResponse {
  message?: 'success';
  email?: string;
  error?: string;
}

export type VerifyRoutes = 'change-email' | 'reset-password' | 'register';
