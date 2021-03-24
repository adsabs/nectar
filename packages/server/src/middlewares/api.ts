import adsapi, { IADSApiBootstrapData } from '@nectar/api';
import { isPast } from 'date-fns';
import { RequestHandler as Middleware } from 'express';

const isExpired = (userData: IADSApiBootstrapData) =>
  isPast(new Date(userData.expire_in));

export const api: Middleware = async (req, res, next) => {
  // grab reference to our current session from the request
  const session = req.session as ISession;

  console.log('session', session);

  // ideal, we have a session and it is not expired, we can move to next
  if (session.userData && !isExpired(session.userData)) {
    return next();
  }

  // bootstrap to get the user data
  try {
    const userData = await adsapi.accounts.bootstrap();
    session.userData = userData;
  } catch (e) {
    console.error(e);
  }
};

export interface ISession extends CookieSessionInterfaces.CookieSessionObject {
  userData: IADSApiBootstrapData;
}

export interface IRequestWithSession extends Request {
  session: ISession;
}
