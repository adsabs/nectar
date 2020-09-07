import { NextApiRequest, NextApiResponse } from 'next';
import { setCookie, parseCookies } from 'nookies';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const parsedCookies = parseCookies({ req });

  console.log(parsedCookies);

  setCookie({ res }, 'fromServer', 'value', {
    maxAge: 30 * 24 * 60 * 60,
    path: '/page',
    secure: true,
  });

  res.status(200).json({ yo: 'sup' });
};
