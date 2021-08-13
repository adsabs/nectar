import { IADSApiBootstrapData } from '@api';
import { Theme } from '../types';

export interface IAppState {
  user: IADSApiBootstrapData;
  theme: Theme;
}

export enum AppEvent {
  SET_USER = 'SET_USER',
  SET_THEME = 'SET_THEME',
}

export type Action =
  | { type: AppEvent.SET_USER; payload: IAppState['user'] }
  | { type: AppEvent.SET_THEME; payload: IAppState['theme'] };
