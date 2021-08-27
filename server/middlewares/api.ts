import Adsapi from '@api';
import { RequestHandler as Middleware } from 'express';

export const api: Middleware = async (req, res, next) => {
  // grab reference to our current session from the request
  const session = req.session;

  // get userData from server, and load into our session
  const result = await Adsapi.checkOrRefreshUserData(session.userData);
  session.userData = result.unwrapOr(null);

  next();
};
