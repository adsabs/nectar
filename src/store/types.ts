import { GetState } from 'zustand';
import { NamedSet } from 'zustand/middleware';
import { IAppStateDocsSlice, IAppStateSearchSlice, IAppStateThemeSlice, IAppStateUserSlice } from './slices';
import { IAppStatePreferencesSlice } from './slices/preferences';

export type AppState = IAppStateSearchSlice &
  IAppStateThemeSlice &
  IAppStateUserSlice &
  IAppStateDocsSlice &
  IAppStatePreferencesSlice;
export interface IPersistedAppState {
  state: AppState;
  version: number;
}

export type StoreSlice<T> = (set: NamedSet<AppState>, get: GetState<AppState>) => T;
