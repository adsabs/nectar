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
  console.log({ id, body });

  const controller = new PaperFormController(id, body, req);

  try {
    const query = await controller.getQuery();
    console.log('redirecting to ', `/search?${query}`);
    res.status(302);
    res.setHeader('Location', `/search?${query}`);
    res.json({ query });
    res.end();
  } catch (e) {
    res.json({
      error: e as Error,
    });
  }

  // const paperFormController = new PaperFormController(params);
  // const query = paperFormController.getQuery();
  // res.redirect(`/search?${query}`);
};
