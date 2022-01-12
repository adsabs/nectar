import { IUserData } from '@api';
import { mergeDeepLeft } from 'ramda';
import { useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import create, { GetState, SetState, StateCreator, StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { devtools, persist, StoreApiWithDevtools, StoreApiWithPersist } from 'zustand/middleware';
import { docsSlice, searchSlice, themeSlice, userSlice } from './slices';
import { AppState } from './types';

export const APP_STORAGE_KEY = 'nectar-app-state';

// simple state logger, override one of these to log out for debugging state
const log =
  (config: StateCreator<AppState>) => (set: SetState<AppState>, get: GetState<AppState>, api: StoreApi<AppState>) =>
    config(set, get, api);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createStore = (preloadedState: Partial<AppState> = {}) => {
  const store = create<
    AppState,
    SetState<AppState>,
    GetState<AppState>,
    StoreApiWithPersist<AppState> & StoreApiWithDevtools<AppState>
  >(
    log(
      devtools(
        persist(
          // State slices which refer to their respective modules
          (set, get) => ({
            ...searchSlice(set, get),
            ...docsSlice(set, get),
            ...userSlice(set, get),
            ...themeSlice(set, get),
            ...preloadedState,
          }),
          {
            name: APP_STORAGE_KEY,
            partialize: (state) => ({ user: state.user, theme: state.theme }),
            merge: (persistedState: AppState, currentState: AppState) => {
              // for now user and theme are all that need persistence
              return {
                ...currentState,
                user: persistedState.user,
                theme: persistedState.theme,
              };
            },
          },
        ),
        { name: APP_STORAGE_KEY },
      ),
    ),
  );
  return store;
};
export type Store = ReturnType<typeof createStore>;

let store: Store;
export const useCreateStore = (incomingState: Partial<AppState> = {}): (() => Store) => {
  // always return a new store if server-side
  if (typeof window === 'undefined') {
    return () => createStore(incomingState);
  }

  console.log('initialState', incomingState);

  // initialize the store
  store = store ?? createStore(incomingState);

  // in the case that initialState changes, merge the changes in
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (incomingState && store) {
      store.setState(mergeDeepLeft(incomingState, store.getState()) as AppState);
    }
  }, [incomingState]);

  return () => store;
};

const appContext = createContext<AppState>();
export const StoreProvider = appContext.Provider;
export const useStore = appContext.useStore;
export const useStoreApi = appContext.useStoreApi;

// handler to be used outside react (non-hook)
export const updateAppUser = (user: IUserData): void => {
  unstable_batchedUpdates(() => {
    store.setState({ user });
  });
};
