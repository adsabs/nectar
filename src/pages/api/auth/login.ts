import { ApiTargets, IBasicAccountsResponse, IUserCredentials } from '@api';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { IronSession } from 'iron-session';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionConfig } from '@config';
import { configWithCSRF, fetchUserData, hash, isValidToken, pickUserData } from '@auth-utils';
import { defaultRequestConfig } from '@api/config';
import axios, { AxiosResponse } from 'axios';
import setCookie from 'set-cookie-parser';

export interface ILoginResponse {
  success?: boolean;
  error?: 'invalid-credentials' | 'login-failed' | 'failed-userdata-request' | 'invalid-token' | 'method-not-allowed';
}

export default withIronSessionApiRoute(login, sessionConfig);

async function login(req: NextApiRequest, res: NextApiResponse<ILoginResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method-not-allowed' });
  }

  const session = req.session;
  const creds = schema.safeParse(req.body);
  if (creds.success) {
    return await handleAuthentication(creds.data, res, session);
  }
  return res.status(401).json({ success: false, error: 'invalid-credentials' });
}

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(4),
  })
  .required() as z.ZodSchema<IUserCredentials>;

export const handleAuthentication = async (
  credentials: IUserCredentials,
  res: NextApiResponse,
  session: IronSession,
) => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.USER,
    data: {
      username: credentials.email,
      password: credentials.password,
    },
  });

  try {
    const { data, headers } = await axios.request<IBasicAccountsResponse, AxiosResponse<IBasicAccountsResponse>>(
      config,
    );
    const apiSessionCookie = setCookie
      .parse(headers['set-cookie'])
      .find((c) => c.name === process.env.ADS_SESSION_COOKIE_NAME);

    if (data.message === 'success') {
      // user has been authenticated
      session.destroy();

      // apply the session cookie to the response
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        // fetch the authenticated user data
        const { data: userData } = await fetchUserData({
          headers: {
            // set the returned session cookie
            Cookie: `${process.env.ADS_SESSION_COOKIE_NAME}=${apiSessionCookie?.value}`,
          },
        });

        if (isValidToken(userData)) {
          // token is valid, we can save the session
          session.token = pickUserData(userData);
          session.isAuthenticated = true;
          session.apiCookieHash = await hash(apiSessionCookie?.value);
          await session.save();
          return res.status(200).json({ success: true });
        } else {
          // in the case the token is invalid, redirect to root
          return res.status(200).json({ success: false, error: 'invalid-token' });
        }
      } catch (e) {
        // if there is an error fetching the user data, we can recover later in a subsequent request
        return res.status(200).json({ success: false, error: 'failed-userdata-request' });
      }
    }
    return res.status(401).json({ success: false, error: 'login-failed' });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'login-failed' });
  }
};
