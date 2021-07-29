import { IADSApiBootstrapData } from '@api';

export interface IAppState {
  user: IADSApiBootstrapData;
}

export enum AppEvent {
  SET_USER = 'SET_USER',
}

export type Action = { type: AppEvent.SET_USER; payload: IAppState['user'] };
