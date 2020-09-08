import { parseCookies, setCookie } from 'nookies';
import { NextApiHandler } from 'next';
import { parseISO, differenceInSeconds } from 'date-fns';
import API from './api';
import getToken from './getToken';

const withAuth = (handler: NextApiHandler): NextApiHandler => {
  return async (req, res) => {
    const cookies = parseCookies({ req });
    console.log('cookies', cookies);
    let tokenString = cookies.token;
    if (!cookies.token) {
      const t = await getToken();

      setCookie({ res }, 'token', t.token, {
        secure: false,
        maxAge: differenceInSeconds(parseISO(t.expires), new Date()) - 1,
        path: '/',
        httpOnly: true,
        domain:
          process.env.NODE_ENV === 'production'
            ? process.env.HOSTNAME
            : 'localhost',
      });

      tokenString = t.token;
    }

    API.defaults.headers.common['Authorization'] = `bearer:${tokenString}`;

    return handler(req, res);
  };
};

export default withAuth;
