import { IADSApiBootstrapData } from '@api';
import { Theme } from '@types';
import { Action, AppEvent, IAppState } from './types';

// main reducer
export const reducer: React.Reducer<IAppState, Action> = (state, { type, payload }) => {
  switch (type) {
    case AppEvent.SET_USER:
      return { ...state, user: payload as IADSApiBootstrapData};
    case AppEvent.SET_THEME:
      return { ...state, theme: payload as Theme};
    default:
      return state;
  }
};
