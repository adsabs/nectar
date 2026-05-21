import { mergeDeepLeft } from 'ramda';
import { useEffect } from 'react';
import create, { GetState, Mutate, SetState, StoreApi } from 'zustand';
import createContext from 'zustand/context';
import { devtools, NamedSet, persist, subscribeWithSelector } from 'zustand/middleware';
import {
  appModeSlice,
  docsSlice,
  notificationSlice,
  orcidSlice,
  searchSlice,
  settingsSlice,
  userSlice,
} from './slices';
import { AppSerializableState, AppState } from './types';
import { isPlainObject, isPrimitive } from 'ramda-adjunct';
import { logger } from '@/logger';
import { IUserData } from '@/api/user/types';

export const APP_STORAGE_KEY = 'nectar-app-state';

export const createStore = (preloadedState: Partial<AppState> = {}) => {
  const state = (set: NamedSet<AppState>, get: GetState<AppState>) => ({
    ...searchSlice(set, get),
    ...docsSlice(set, get),
    ...userSlice(set, get),
    ...appModeSlice(set, get),
    ...settingsSlice(set, get),
    ...orcidSlice(set, get),
    ...notificationSlice(set, get),
    ...preloadedState,
  });

  // return a basic store during testing
  if (process.env.NODE_ENV === 'test') {
    return create<AppState>(subscribeWithSelector(state));
  }

  return create<
    AppState,
    SetState<AppState>,
    GetState<AppState>,
    Mutate<
      StoreApi<AppState>,
      [['zustand/subscribeWithSelector', never], ['zustand/devtools', never], ['zustand/persist', Partial<AppState>]]
    >
  >(
    subscribeWithSelector(
      devtools(
        persist(state, {
          name: APP_STORAGE_KEY,
          partialize: (state) => ({
            user: state.user,
            mode: state.mode,
            numPerPage: state.numPerPage,
            settings: state.settings,
            orcid: state.orcid,
          }),
          merge: mergeDeepLeft,
        }),
        { name: APP_STORAGE_KEY },
      ),
    ),
  );
};
export type Store = ReturnType<typeof createStore>;

let store: Store;
// Tracks the last incomingState.mode that was applied synchronously. Used to distinguish
// genuine page-navigation state (new incomingState reference → apply) from same-page
// re-renders caused by client-side mode changes (same incomingState → skip, preserving
// the user's change). Reset when incomingState changes.
let lastSyncedIncomingMode: string | undefined;

export const useCreateStore = (incomingState: Partial<AppState> = {}): (() => Store) => {
  // always return a new store if server-side
  if (typeof window === 'undefined') {
    return () => createStore(incomingState);
  }

  if (process.env.NODE_ENV === 'development') {
    logger.debug({ incomingState }, 'useCreateStore');
  }

  // initialize the store
  store = store ?? createStore(incomingState);

  // Synchronously apply mode from GSSP state on page navigation (new incomingState).
  // useApplyBoostTypeToParams derives boostType from appMode. If mode is stale on the first
  // render (singleton store from a previous page), boostType is wrong → cache key changes
  // after the useEffect correction → second search fires. Applying before children render
  // keeps boostType stable.
  //
  // The lastSyncedIncomingMode guard prevents overriding client-side mode changes: when the
  // user switches discipline on the same page, incomingState.mode stays at the SSR value but
  // we should NOT revert their change on subsequent re-renders.
  if (incomingState.mode !== lastSyncedIncomingMode && !store.getState().urlModeOverride) {
    lastSyncedIncomingMode = incomingState.mode;
    const currentMode = store.getState().mode;
    if (incomingState.mode && currentMode !== incomingState.mode) {
      store.setState({ mode: incomingState.mode });
    }
  }

  // force reset of the search facets
  setTimeout(() => store.getState().resetSearchFacets(), 300);

  // in the case that initialState changes, merge the changes in
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (incomingState && store) {
      // searchMode is owned by setSearchMode (user action) and createStore (initial SSR seed).
      // Merging it here on navigation would restore ADS_COMPAT even after the user explicitly
      // cleared it by switching disciplines. Exclude it so user changes are sticky.
      const { searchMode: _s, ...rest } = incomingState;
      store.setState(mergeDeepLeft(rest, store.getState()) as AppState);
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
  store?.setState({ user });
};

export const getSerializableDefaultStore = () => {
  const state = createStore().getState();
  return Object.keys(state).reduce((acc, key) => {
    const value = state[key as keyof AppState];
    if (isPlainObject(value) || isPrimitive(value)) {
      return { ...acc, [key]: value };
    }
    return acc;
  }, {}) as AppSerializableState;
};

export const createSelector = <T>(selector: (state: AppState) => T) => {
  return (state: AppState) => selector(state);
};
