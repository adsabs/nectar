import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@/config';
import { IronSession } from 'iron-session';
import { getIronSession } from 'iron-session/edge';

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession['token'];
  bot?: boolean;
}

const user = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession(req, res, sessionConfig);

  if (session.bot) {
    return res.json({ isAuthenticated: false, user: undefined, bot: true });
  }

  return res.json({
    isAuthenticated: session.isAuthenticated,
    user: session.token,
  });
};

export default user;
