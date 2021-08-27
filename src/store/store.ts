import { Theme } from '@types';
import React from 'react';
import { reducer } from './reducer';
import { Action, IAppState } from './types';
const APP_STORAGE_KEY = 'nectar-app-state';

export const initialAppState: IAppState = {
  user: {
    username: 'anonymous',
    anonymous: true,
    access_token: '',
    expire_in: '',
  },
  theme: Theme.GENERAL,
};

// wrap the main reducer so we can debug/push changes to local storage
const reducerWrapper: React.Reducer<IAppState, Action> = (state, action) => {
  const newState: IAppState = reducer(state, action);

  // flush the current state to localStorage
  requestAnimationFrame(() => {
    // skip storing user data, we'll grab that from the server session
    const { user, ...state } = newState;
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
  });

  return newState;
};

type AppStoreApi = {
  state: IAppState;
  dispatch: React.Dispatch<Action>;
};

const ctx = React.createContext<AppStoreApi>({
  state: initialAppState,
  dispatch: () => ({}),
});

const AppProvider = (props: React.PropsWithChildren<Record<string, unknown>>): React.ReactElement => {
  const [state, dispatch] = React.useReducer(
    reducerWrapper,
    initialAppState,
    (initial): IAppState => {
      const isServer = typeof window === 'undefined';
      const sessionEl = isServer ? null : document.getElementById('__session__');

      return isServer
        ? initial
        : {
            ...initial,
            user: sessionEl !== null ? (JSON.parse(sessionEl.textContent) as IAppState['user']) : initial.user,
            ...((JSON.parse(localStorage.getItem(APP_STORAGE_KEY)) as IAppState) || initial),
          };
    },
  );
  return React.createElement(ctx.Provider, { value: { state, dispatch }, ...props });
};

const useAppCtx = (): AppStoreApi => {
  const context = React.useContext(ctx);
  if (typeof context === 'undefined') {
    throw new Error('no provider for AppContext');
  }
  return context;
};

export { AppProvider, useAppCtx };
