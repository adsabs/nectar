import { NextApiRequest, NextApiResponse } from 'next';

export function classicformController(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  const classicParams = req.body as Record<string, unknown>;

  res.status(200).json(classicParams);

  // res.redirect('/search?q=star');
}
