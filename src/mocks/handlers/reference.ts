import { rest } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';
import { IADSApiReferenceResponse } from '@/api/reference/types';

export const referenceHandlers = [
  rest.get<unknown, { text: string }>(apiHandlerRoute(ApiTargets.REFERENCE), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<IADSApiReferenceResponse>({
        resolved: {
          refstring: req.params.text,
          score: '1.0',
          bibcode: '2000A&A...362..333S',
        },
      }),
    );
  }),
];
