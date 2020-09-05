import { NextApiRequest, NextApiResponse } from 'next';
import search from '@api/search';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: { q },
  } = req;
  const query = Array.isArray(q) ? q.join('') : q ?? '';
  const value = await search(query);

  res.status(200).json(value);
};
