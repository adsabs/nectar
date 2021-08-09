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

export type Action = { type: AppEvent; payload: IAppState['user'] | IAppState['theme'] };
