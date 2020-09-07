import { NextApiRequest, NextApiResponse } from 'next';
import search from '@api/search';
import withAuth from '@api/withAuth';
import withCors from '@api/withCors';

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: { q, fl, s },
  } = req;
  const query = Array.isArray(q) ? q.join('') : q ?? '';
  const fields = Array.isArray(fl) ? fl.join('') : fl;
  const sort = Array.isArray(s) ? s.join('') : s;

  try {
    const value = await search({ query, fields, sort });
    res.status(200).json(value);
  } catch (e) {
    console.log(e);

    res.status(400).json({ error: e.message });
  }
};

export default withCors(withAuth(searchHandler));
