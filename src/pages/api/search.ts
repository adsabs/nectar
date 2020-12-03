import search from '@api/search';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function (req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(await search({ req }));
}
