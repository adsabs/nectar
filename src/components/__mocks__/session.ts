import { IncomingMessage } from 'http';

export const mockSession: IncomingMessage['session'] = {
  userData: {
    access_token: '',
    anonymous: true,
    expire_in: '9999-01-01T00:00:00',
    username: 'anonymous',
  },
};
