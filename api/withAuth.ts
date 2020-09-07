import { parseCookies, setCookie } from 'nookies';
import { NextApiHandler } from 'next';
import API from './api';
import getToken from './getToken';

const withAuth = (handler: NextApiHandler): NextApiHandler => {
  return async (req, res) => {
    const cookies = parseCookies({ req });
    console.log('cookies', cookies);
    const token = cookies.token ?? (await getToken());

    setCookie({ res }, 'token', token, {
      secure: false,
      maxAge: 24 * 60 * 60,
      path: '/',
      httpOnly: true,
      domain:
        process.env.NODE_ENV === 'production'
          ? process.env.HOSTNAME
          : 'localhost',
    });
    API.defaults.headers.common['Authorization'] = `bearer:${token}`;

    return handler(req, res);
  };
};

export default withAuth;
