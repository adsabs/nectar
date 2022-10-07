import { GetState } from 'zustand';
import { NamedSet } from 'zustand/middleware';
import {
  IAppStateDocsSlice,
  IAppStateSearchSlice,
  IAppStateSettingsSlice,
  IAppStateThemeSlice,
  IAppStateUserSlice,
} from './slices';

export type AppState = IAppStateSettingsSlice &
  IAppStateThemeSlice &
  IAppStateSearchSlice &
  IAppStateSettingsSlice &
  IAppStateUserSlice &
  IAppStateDocsSlice;
export interface IPersistedAppState {
  state: AppState;
  version: number;
}

export type StoreSlice<T> = (set: NamedSet<AppState>, get: GetState<AppState>) => T;
