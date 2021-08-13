import { initialAppState } from './store';
import { Action, AppEvent, IAppState } from './types';

// main reducer
export const reducer: React.Reducer<IAppState, Action> = (state, action) => {
  switch (action.type) {
    case AppEvent.SET_USER:
      return { ...state, user: action.payload };
    case AppEvent.SET_THEME:
      return { ...state, theme: action.payload };
    case AppEvent.INVALIDATE_TOKEN:
      return {
        ...state,
        user: {
          ...state.user,
          access_token: initialAppState.user.access_token,
          expire_in: initialAppState.user.expire_in,
        },
      };
    default:
      return state;
  }
};
