import { rest } from 'msw';
import { ApiTargets, IADSApiReferenceResponse } from '@api';
import { apiHandlerRoute } from '@mocks/mockHelpers';

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
