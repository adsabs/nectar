import { IronSessionData } from 'iron-session';

export const mockSession: IronSessionData = {
  token: {
    access_token: '',
    anonymous: true,
    expire_in: '9999-01-01T00:00:00',
    username: 'anonymous',
  },
  isAuthenticated: false,
  bot: false,
};
