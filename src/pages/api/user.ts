/// <reference types="../../../global" />
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@/config';
import { IronSession } from 'iron-session';
import { getIronSession } from 'iron-session/edge';

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession['token'];
}

const user = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession(req, res, sessionConfig);

  return res.json({
    isAuthenticated: session.isAuthenticated,
    user: session.token,
  });
};

export default user;
