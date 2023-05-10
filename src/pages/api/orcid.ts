import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { ApiTargets } from '@api';

const querySchema = z.object({ code: z.string() });

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code } = querySchema.parse(req.query);
    console.log(req.session);

    const search = new URLSearchParams({ code });
    const headers = new Headers({
      authorization: `Bearer: ${req.session.token.access_token}`,
      cookie: req.headers.cookie,
    });
    const res = await fetch(`${process.env.API_HOST_SERVER}/${ApiTargets.ORCID_EXCHANGE_TOKEN}?${search.toString()}`, {
      headers,
    });
    console.log(await res.json());
  } catch (e) {
    console.log('error', e);
  }
}
