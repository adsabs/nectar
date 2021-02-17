import axios from 'axios';
import { isPast, parseISO } from 'date-fns';
import { NextFunction, Request, Response } from 'express';
import { IncomingMessage } from 'http';

const isExpired = (user: IUserData) => {
  return isPast(parseISO(user.expires_in));
};

const apiMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // get a reference to OUR current session cookie
  const session = req.session as ISession;

  // check if session user is set and is not expired
  if (session.user && !isExpired(session.user)) {
    return next();
  }

  // pass the cookies along to bootstrap, if applicable
  let headers: { cookie?: string | string[] } = {};
  if (req.headers.cookie) {
    headers.cookie = req.headers.cookie;
  }

  // bootstrap to get the user data
  const {
    data: { username, anonymous, access_token, expires_in },
    headers: bootstrapHeaders,
  } = await axios.get<IUserData>(
    `${process.env.NEXT_PUBLIC_API_HOST}/accounts/bootstrap`,
    {
      headers,
    }
  );

  // store the user data in our session
  session.user = { username, anonymous, access_token, expires_in };
  session.apiSessionCookie = res.setHeader(
    'set-cookie',
    bootstrapHeaders['set-cookie'][0]
  );

  next();
};

interface IUserData {
  username: string;
  anonymous: boolean;
  access_token: string;
  expires_in: string;
}

export interface ISession extends CookieSessionInterfaces.CookieSessionObject {
  user: IUserData;
}

export interface IIncomingMessageWithSession extends IncomingMessage {
  session: ISession | null;
  body: Request['body'];
}

export default apiMiddleware;
