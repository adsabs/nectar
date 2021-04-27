import Adsapi, { IADSApiBootstrapData } from '@nectar/api';
import { isPast, parseISO } from 'date-fns';
import { RequestHandler as Middleware } from 'express';

const isExpired = (userData: IADSApiBootstrapData) =>
  isPast(parseISO(userData.expire_in));

export const api: Middleware = async (req, res, next) => {
  // grab reference to our current session from the request
  const session = req.session as ISession;

  // ideal, we have a session and it is not expired, we can move to next
  if (session.userData && !isExpired(session.userData)) {
    return next();
  }

  // bootstrap to get the user data
  const result = await Adsapi.bootstrap();
  result.map((userData) => (session.userData = userData));
  next();
};

export interface ISession extends CookieSessionInterfaces.CookieSessionObject {
  userData: IADSApiBootstrapData;
}

export interface IRequestWithSession extends Request {
  session: ISession;
}
