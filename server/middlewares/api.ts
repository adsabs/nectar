import { RequestHandler as Middleware } from 'express';
import Adsapi from '../../src/api';
import { checkUserData } from '../../src/api/lib/utils';

export const api: Middleware = async (req, res, next) => {
  // grab reference to our current session from the request
  const session = req.session;
  const currentUserData = session.userData ?? null;

  // check if we have valid current userData, if so move on
  if (checkUserData(currentUserData)) {
    return next();
  }
  const api = new Adsapi();

  const bootstrapResponse = await api.accounts.bootstrap();
  if (bootstrapResponse.isOk()) {
    const { data, headers } = bootstrapResponse.value;

    // put the userData in the session
    session.userData = data;

    // should have recieved a session cookie, pass that in the response
    res.setHeader('set-cookie', headers['set-cookie']);
  }

  next();
};
