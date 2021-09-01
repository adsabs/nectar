import { Action, AppEvent, IAppState } from './types';

// main reducer
export const reducer: React.Reducer<IAppState, Action> = (state, action) => {
  switch (action.type) {
    case AppEvent.SET_USER:
      return { ...state, user: action.payload };
    case AppEvent.SET_THEME:
      return { ...state, theme: action.payload };
    default:
      return state;
  }
};
