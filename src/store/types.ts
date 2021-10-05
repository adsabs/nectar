import { IADSApiSearchParams, IUserData } from '@api';
import { Theme } from '../types';

export interface IAppState {
  user: IUserData;
  theme: Theme;
  query: IADSApiSearchParams;
}

export enum AppEvent {
  SET_USER = 'SET_USER',
  SET_THEME = 'SET_THEME',
  SET_CURRENT_QUERY = 'SET_CURRENT_QUERY',
}

export type Action =
  | { type: AppEvent.SET_USER; payload: IAppState['user'] }
  | { type: AppEvent.SET_THEME; payload: IAppState['theme'] }
  | { type: AppEvent.SET_CURRENT_QUERY; payload: IAppState['query'] };
