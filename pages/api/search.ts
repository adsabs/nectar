import { NextApiRequest, NextApiResponse } from 'next';
import search from '@api/search';
import withAuth from '@api/withAuth';
import withCors from '@api/withCors';
import { AxiosError } from 'axios';

const parse = (val: string | string[], _default?: string) => {
  return Array.isArray(val) ? val.join('') : val ?? _default;
};

const searchHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: { q, fl, s, c },
  } = req;
  try {
    const value = await search({
      query: parse(q, ''),
      fields: parse(fl),
      sort: parse(s),
      nextCursorMark: parse(c),
    });
    res.status(200).json(value);
  } catch (e) {
    console.log((e as AxiosError).response?.data.error);

    res.status(400).json({ error: e.message });
  }
};

export default withCors(withAuth(searchHandler));
