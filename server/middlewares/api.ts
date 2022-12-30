import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { isPast, parseISO } from 'date-fns';
import { RequestHandler as Middleware } from 'express';
import { isNil, path } from 'ramda';
import { IBootstrapPayload, IUserData } from '../../src/api/accounts/types';
import { getDynamicConfig } from '../../src/api/config';
import { ApiTargets } from '../../src/api/models';

const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

const checkUserData = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isPast(parseISO(userData.expire_in));
};

export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

// interface IADSApiBootstrapResponse extends AxiosResponse<IBootstrapPayload> {}

export const api: Middleware = (req, res, next) => {
  // get hold of the incoming session cookie
  const sessionCookie = (req.cookies as Record<string, string>)?.['session'];

  // get user data from session
  const currentUserData = req.session.userData ?? null;

  // check if we have valid current userData, if so move on
  if (checkUserData(currentUserData)) {
    return next();
  }

  // configure bootstrap request
  const config: AxiosRequestConfig = {
    ...getDynamicConfig(),
    method: 'get',
    url: ApiTargets.BOOTSTRAP,
    withCredentials: true,
    headers: {
      Accept: 'application/json text/plain */*',
      ...(sessionCookie ? { Cookie: [`session=${sessionCookie};`] } : {}),
    },
  };

  req.log.info('[API] Bootstrapping...');

  axios
    .request<IBootstrapPayload, AxiosResponse<IBootstrapPayload>>(config)
    .then((response) => {
      const { data } = response;

      // sets the new user data on the session, this will be used in the GSSPs to get api data
      req.session.userData = data;

      // set authenticated flag based on incoming user data
      req.session.isAuthenticated = isAuthenticated(data);

      const setCookieValue = path(['headers', 'set-cookie'], response);
      // make sure to also send along the new cookie
      if (Array.isArray(setCookieValue)) {
        res.setHeader('set-cookie', setCookieValue);
      }

      req.log.info('[API] Bootstrapped, ready for server-side API calls');
    })
    .catch(() => {
      req.log.error('Bootstrapping failed');
    })
    .finally(() => {
      next();
    });
};
