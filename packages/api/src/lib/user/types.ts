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

export interface IRegisterResponse {
  message: string;
}

export interface IRegisterErrorResponse {
  error: string;
}

export interface ICSRFResponse {
  csrf: string;
}
