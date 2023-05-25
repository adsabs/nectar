import { IAuthForm, IAuthFormEvent } from '@lib/auth/types';
import { Reducer } from 'react';

export const getDefaultReducer = <T>(initialState: IAuthForm<T>): Reducer<IAuthForm<T>, IAuthFormEvent<T>> => {
  return (state, action) => {
    switch (action.type) {
      case 'setEmail':
        return { ...state, params: { ...state.params, email: action.email }, status: 'idle' };
      case 'setRecaptcha':
        return { ...state, params: { ...state.params, recaptcha: action.recaptcha }, status: 'idle' };
      case 'setCurrentPassword':
        return { ...state, params: { ...state.params, currentPassword: action.currentPassword }, status: 'idle' };
      case 'setPassword':
        return { ...state, params: { ...state.params, password: action.password }, status: 'idle' };
      case 'setPasswordConfirm':
        return { ...state, params: { ...state.params, confirmPassword: action.confirmPassword }, status: 'idle' };
      case 'setError':
        // essentially resets, but keeps email so it doesn't clear the form
        return {
          error: action.error,
          status: 'error',
          params: { ...state.params, recaptcha: null },
        };
      case 'submit':
        return { ...state, status: 'submitting' };
      case 'reset':
        return initialState;
      default:
        return state;
    }
  };
};
