import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@config';
import { getIronSession, IronSession } from 'iron-session';
import { SessionData } from '@types';

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession<SessionData>['token'];
}

const user = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getIronSession<SessionData>(req, res, sessionConfig);
  return res.json({
    isAuthenticated: session.isAuthenticated,
    user: session.token,
  });
};

export default user;
