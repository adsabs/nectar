import { IADSApiBootstrapData } from '@api';
import { Topic } from '../types';

export interface IAppState {
  user: IADSApiBootstrapData;
  topic: Topic;
}

export enum AppEvent {
  SET_USER = 'SET_USER',
  SET_TOPIC = 'SET_TOPIC',
}

export type Action = { type: AppEvent; payload: IAppState['user'] | IAppState['topic'] };
