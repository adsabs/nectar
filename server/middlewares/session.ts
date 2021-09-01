import expressSession, { SessionOptions } from 'express-session';

const config: SessionOptions = {
  secret: [process.env.COOKIE_SECRET],
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
  },
};

export const session = expressSession(config);
