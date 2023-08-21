import { GetState } from 'zustand';
import { NamedSet } from 'zustand/middleware';
import {
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
  IThemeAction,
  IThemeState,
  IUserAction,
  IUserState,
} from './slices';

export type AppSerializableState = IDocsState &
  ISearchState &
  ISettingsState &
  IThemeState &
  IUserState &
  IORCIDState &
  INotificationState;

export type AppActions = IDocsAction &
  ISearchAction &
  ISettingsAction &
  IThemeAction &
  IUserAction &
  IORCIDAction &
  INotificationAction;

export type AppState = AppSerializableState & AppActions;

export interface IPersistedAppState {
  state: AppState;
  version: number;
}

export type StoreSlice<T> = (set: NamedSet<AppState>, get: GetState<AppState>) => T;
