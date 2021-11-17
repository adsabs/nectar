import { AUTH_STORAGE_KEY } from '@api/lib/utils';
import { Theme } from '@types';
import { isBrowser, safeParse } from '@utils';
import {
  createContext,
  createElement,
  Dispatch,
  PropsWithChildren,
  ReactElement,
  Reducer,
  useContext,
  useReducer,
} from 'react';
import { reducer } from './reducer';
import { Action, IAppState } from './types';

const APP_STORAGE_KEY = 'nectar-app-state';
export const initialAppState: IAppState = {
  user: {
    username: 'anonymous',
    anonymous: true,
  },
  theme: Theme.GENERAL,
  query: null,
};

// wrap the main reducer so we can debug/push changes to local storage
const nectarAppReducer: Reducer<IAppState, Action> = (state, action) => {
  console.groupCollapsed(`%cStore`, 'padding: 5px; color: white; background: dodgerblue', action.type);
  console.log('old', state);
  const newState: IAppState = reducer(state, action);
  console.log('new', newState);
  console.groupEnd();

  // flush the new state to localStorage
  requestAnimationFrame(() => {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(newState));
  });

  return newState;
};

type AppStoreApi = {
  state: IAppState;
  dispatch: Dispatch<Action>;
};

const ctx = createContext<AppStoreApi>({
  state: null,
  dispatch: () => ({}),
});

const AppProvider = (props: PropsWithChildren<{ initialStore?: Partial<IAppState> }>): ReactElement => {
  const { initialStore } = props;
  const [state, dispatch] = useReducer(nectarAppReducer, initialAppState, (initial): IAppState => {
    // initializing store, this will use persisted (localStorage) data or default values

    if (typeof initialStore !== 'undefined') {
      return {
        ...initial,
        ...initialStore,
      };
    }

    if (isBrowser()) {
      // pull only the username, in case user is logged in already
      const { username, anonymous } = safeParse(localStorage.getItem(AUTH_STORAGE_KEY), initialAppState.user);
      return {
        ...initial,
        ...safeParse(localStorage.getItem(APP_STORAGE_KEY), initial),
        user: { username, anonymous },
      };
    }

    return initial;
  });

  return createElement(ctx.Provider, { value: { state, dispatch }, ...props });
};

const useAppCtx = (): AppStoreApi => {
  const context = useContext(ctx);
  if (typeof context === 'undefined') {
    throw new Error('no provider for AppContext');
  }
  return context;
};

export { AppProvider, useAppCtx };
