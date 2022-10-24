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

export type BasicMsg<T = unknown> = {
  result?: T;
  error?: string;
  ok: boolean;
};
