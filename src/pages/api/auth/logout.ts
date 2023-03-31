import { isUserData, IUserData } from '@api';
import { logoutUser } from '@auth-utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getIronSession } from 'iron-session';
import { sessionConfig } from '@config';

interface Output {
  success?: boolean;
  user?: IUserData;
  error?: string;
}

export default async function (req: NextApiRequest, res: NextApiResponse<Output>) {
  const session = await getIronSession(req, res, sessionConfig);
  if (req.method === 'POST') {
    const result = await logoutUser(res);

    if (result === true) {
      // logged out successfully, but bootstrap failed
      // clear the session values, we should be able to sync later on
      session.destroy();

      return res.status(200).json({ success: true });
    } else if (typeof result === 'string') {
      // logout request failed with an error code
      return res.status(200).json({ success: false, error: result });
    } else if (result && isUserData(result)) {
      // success! user is logged out, and we have a new anon token for the session
      session.token = result;
      session.isAuthenticated = false;
      await session.save();

      return res.status(200).json({ success: true, user: result });
    }
    return res.status(200).json({ success: false, error: 'Could not logout user, unknown server issue' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
