import { IUserData } from '@api';
import { Theme } from '../types';

export interface IAppState {
  user: IUserData;
  theme: Theme;
}

export enum AppEvent {
  SET_USER = 'SET_USER',
  SET_THEME = 'SET_THEME',
  INVALIDATE_TOKEN = 'INVALIDATE_TOKEN',
}

export type Action =
  | { type: AppEvent.SET_USER; payload: IAppState['user'] }
  | { type: AppEvent.SET_THEME; payload: IAppState['theme'] }
  | { type: AppEvent.INVALIDATE_TOKEN };
