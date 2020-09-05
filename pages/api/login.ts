import { NextApiRequest, NextApiResponse } from 'next';
import { withIronSession } from 'next-iron-session';

export default withIronSession(
  async (req: NextApiRequest, res: NextApiResponse) => {
    res.status(200).json(value);
  },
  {
    cookieName: 'user',
    password: 'blahblahblah',
  }
);
