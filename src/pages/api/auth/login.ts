import { isAuthenticated, isUserData, IUserData } from '@api';
import { authenticateUser } from '@hooks/useSession/helpers';
import { IUserCredentials } from '@hooks/useSession/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

interface Output {
  success?: boolean;
  error?: string | z.ZodError;
  user?: IUserData;
}

export default async function (req: NextApiRequest, res: NextApiResponse<Output>) {
  if (req.method === 'POST') {
    try {
      const creds = parseCredentials(req.body);
      const result = await authenticateUser(creds, res);

      if (result === true) {
        // logged in successfully, but bootstrap failed
        // clear the session values, we should be able to sync later on
        req.session.userData = null;
        req.session.isAuthenticated = null;

        return res.status(200).json({ success: true });
      } else if (typeof result === 'string') {
        // login request failed with an error code
        return res.status(200).json({ success: false, error: result });
      } else if (result && isUserData(result)) {
        // success! user is logged in, and we have the new
        req.session.userData = result;
        req.session.isAuthenticated = isAuthenticated(result);
        return res.status(200).json({ success: true, user: result });
      }
      return res.status(200).json({ success: false, error: 'Could not login user, unknown server issue' });
    } catch (e) {
      // parsing the incoming body failed
      return res.status(200).json({ success: false, error: e as z.ZodError });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(4),
  })
  .required();

const parseCredentials = (creds: unknown) => {
  return schema.parse(creds) as IUserCredentials;
};