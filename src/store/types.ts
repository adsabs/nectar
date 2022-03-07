import { GetState } from 'zustand';
import { NamedSet } from 'zustand/middleware';
import {
  IAppStateDocsSlice,
  IAppStatePaginationSlice,
  IAppStateSearchSlice,
  IAppStateThemeSlice,
  IAppStateUserSlice,
} from './slices';

export type AppState = IAppStatePaginationSlice &
  IAppStateSearchSlice &
  IAppStateThemeSlice &
  IAppStateUserSlice &
  IAppStateDocsSlice;
export interface IPersistedAppState {
  state: AppState;
  version: number;
}

export type StoreSlice<T> = (set: NamedSet<AppState>, get: GetState<AppState>) => T;
