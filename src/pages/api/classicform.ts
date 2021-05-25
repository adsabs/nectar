import { classicformController } from '@controllers/classicformController';
import type { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse): void => {
  classicformController(req, res);
};
