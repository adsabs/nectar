import { IADSApiBootstrapData } from '@api';
import { Topic } from '@types';
import { Action, AppEvent, IAppState } from './types';

// main reducer
export const reducer: React.Reducer<IAppState, Action> = (state, { type, payload }) => {
  switch (type) {
    case AppEvent.SET_USER:
      return { ...state, user: payload as IADSApiBootstrapData};
    case AppEvent.SET_TOPIC:
      return { ...state, topic: payload as Topic};
    default:
      return state;
  }
};
