import { Action, AppEvent, IAppState } from './types';

// main reducer
export const reducer: React.Reducer<IAppState, Action> = (state, { type, payload }) => {
  switch (type) {
    case AppEvent.SET_USER:
      return { ...state, user: payload as IAppState['user']};
    case AppEvent.SET_THEME:
      return { ...state, theme: payload as IAppState['theme']};
    default:
      return state;
  }
};
