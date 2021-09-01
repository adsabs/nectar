import CookieSession from 'cookie-session';

const config: CookieSessionInterfaces.CookieSessionOptions = {
  name: 'nectar_session',
  keys: [process.env.COOKIE_SECRET || ''],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: false,
  secure: false,
};

export const session = CookieSession(config);
