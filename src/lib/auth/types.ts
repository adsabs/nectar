import { UseToastOptions } from '@chakra-ui/react';

export type BasicMsg<T = unknown> = {
  result?: T;
  error?: string;
  ok: boolean;
};

export interface IAuthHooksOptions<T extends BasicMsg> {
  noRedirect?: boolean;
  successToastOptions?: UseToastOptions;
  onSuccess?: (msg: T) => void;
  onError?: (msg: T) => void;
  enabled?: boolean;
  redirectUri?: string;
}

export interface IAuthForm<T> {
  params: T;
  error: string;
  status: 'submitting' | 'idle' | 'error';
}

export type IAuthFormEvent<T> =
  | {
      type: 'setEmail';
      email: T[keyof T];
    }
  | { type: 'setRecaptcha'; recaptcha: T[keyof T] }
  | { type: 'setError'; error: string }
  | { type: 'setCurrentPassword'; currentPassword: string }
  | { type: 'setPassword'; password: string }
  | { type: 'setPasswordConfirm'; confirmPassword: string }
  | { type: 'submit' }
  | { type: 'reset' };
