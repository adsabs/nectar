import { GetState, SetState } from 'zustand';
import { IAppStateDocsSlice, IAppStateSearchSlice, IAppStateThemeSlice, IAppStateUserSlice } from './slices';

export type AppState = IAppStateSearchSlice & IAppStateThemeSlice & IAppStateUserSlice & IAppStateDocsSlice;
export interface IPersistedAppState {
  state: AppState;
  version: number;
}

export type StoreSlice<T> = (set: SetState<AppState>, get: GetState<AppState>) => T;
