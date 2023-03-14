import { GetState } from 'zustand';
import { NamedSet } from 'zustand/middleware';
import {
  IDocsAction,
  IDocsState,
  ISearchAction,
  ISearchState,
  ISettingsAction,
  ISettingsState,
  IThemeAction,
  IThemeState,
  IUserAction,
  IUserState,
} from './slices';

export type AppSerializableState = IDocsState & ISearchState & ISettingsState & IThemeState & IUserState;
export type AppActions = IDocsAction & ISearchAction & ISettingsAction & IThemeAction & IUserAction;

export type AppState = AppSerializableState & AppActions;

export interface IPersistedAppState {
  state: AppState;
  version: number;
}

export type StoreSlice<T> = (set: NamedSet<AppState>, get: GetState<AppState>) => T;
