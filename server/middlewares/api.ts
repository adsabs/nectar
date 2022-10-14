import axios, { AxiosResponse } from 'axios';
import { isPast, parseISO } from 'date-fns';
import { RequestHandler as Middleware } from 'express';
import { isNil } from 'ramda';
import { IBootstrapPayload, IUserData } from '../../src/api/accounts/types';
import { defaultRequestConfig } from '../../src/api/config';
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

interface IADSApiBootstrapResponse extends AxiosResponse<IBootstrapPayload> {
  headers: {
    'set-cookie': string;
  };
}

export const api: Middleware = (req, res, next) => {
  // grab reference to our current session from the request
  const session = req.session;
  const currentUserData = session.userData ?? null;

  // check if we have valid current userData, if so move on
  if (checkUserData(currentUserData)) {
    return next();
  }

  axios
    .get<IBootstrapPayload, IADSApiBootstrapResponse>(ApiTargets.BOOTSTRAP, defaultRequestConfig)
    .then((response) => {
      const { data, headers } = response;

      session.userData = data;
      res.setHeader('set-cookie', headers['set-cookie']);
    })
    .catch((e) => {
      console.log('Server-side bootstrapping error\n', e);
    })
    .finally(() => {
      next();
    });
};
