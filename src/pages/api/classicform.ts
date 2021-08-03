import { ClassicformController, RawClassicFormParams } from '@controllers/classicformController';
import type { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse): void => {
  const params = req.body as RawClassicFormParams;
  const classicFormController = new ClassicformController(params);
  const query = classicFormController.getQuery();
  res.redirect(`/search?${query}`);
};
