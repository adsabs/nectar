import Adsapi from '@api';
import { PaperFormController, PaperFormType, RawPaperFormParams } from '@controllers/paperformController';
import type { NextApiRequest, NextApiResponse } from 'next';

export interface PaperFormRequest extends NextApiRequest {
  body: RawPaperFormParams;
  query: {
    id: PaperFormType;
  };
}

export default async (req: PaperFormRequest, res: NextApiResponse): Promise<void> => {
  const {
    query: { id },
    body,
  } = req;

  const adsapi = new Adsapi({ token: req.session.userData.access_token });

  try {
    const controller = new PaperFormController(id, body, adsapi);
    const query = await controller.getQuery();
    res.writeHead(302, { Location: `/search?${query}` });
  } catch (e) {
    res.writeHead(500, { Location: '/error/server' });
  } finally {
    res.end();
  }
};
