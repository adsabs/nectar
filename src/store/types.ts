import { GetState } from 'zustand';
import { NamedSet } from 'zustand/middleware';
import {
  IAppModeAction,
  IAppModeState,
  IDocsAction,
  IDocsState,
  INotificationAction,
  INotificationState,
  IORCIDAction,
  IORCIDState,
  ISearchAction,
  ISearchState,
  ISettingsAction,
  ISettingsState,
  IUserAction,
  IUserState,
} from './slices';

export type AppSerializableState = IDocsState &
  ISearchState &
  ISettingsState &
  IAppModeState &
  IUserState &
  IORCIDState &
  INotificationState;

export type AppActions = IDocsAction &
  ISearchAction &
  ISettingsAction &
  IAppModeAction &
  IUserAction &
  IORCIDAction &
  INotificationAction;

export type AppState = AppSerializableState & AppActions;

export interface IPersistedAppState {
  state: AppState;
  version: number;
}

export type StoreSlice<T> = (set: NamedSet<AppState>, get: GetState<AppState>) => T;
