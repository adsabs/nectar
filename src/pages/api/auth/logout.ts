import { isUserData, IUserData } from '@api';
import { logoutUser } from '@hooks/useSession/helpers';
import type { NextApiRequest, NextApiResponse } from 'next';

interface Output {
  success?: boolean;
  user?: IUserData;
  error?: string;
}

export default async function (req: NextApiRequest, res: NextApiResponse<Output>) {
  if (req.method === 'POST') {
    const result = await logoutUser(res);

    if (result === true) {
      // logged out successfully, but bootstrap failed
      // clear the session values, we should be able to sync later on
      req.session.userData = null;
      req.session.isAuthenticated = false;

      return res.status(200).json({ success: true });
    } else if (typeof result === 'string') {
      // logout request failed with an error code
      return res.status(200).json({ success: false, error: result });
    } else if (result && isUserData(result)) {
      // success! user is logged out, and we have a new anon token for the session
      req.session.userData = result;
      req.session.isAuthenticated = false;
      return res.status(200).json({ success: true, user: result });
    }
    return res.status(200).json({ success: false, error: 'Could not logout user, unknown server issue' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
