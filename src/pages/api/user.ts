/// <reference types="../../../global" />
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@config';
import { IronSession } from 'iron-session';

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession['token'];
}

const user = (req: NextApiRequest, res: NextApiResponse) => {
  return res.json({
    isAuthenticated: req.session.isAuthenticated,
    user: req.session.token,
  });
};

export default withIronSessionApiRoute(user, sessionConfig);
