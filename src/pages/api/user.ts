import { getIronSession } from 'iron-session';
import { sessionConfig } from '@config';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const session = await getIronSession(req, res, sessionConfig);

  return res.json({
    isAuthenticated: session.isAuthenticated,
    user: session.token,
  });
}
