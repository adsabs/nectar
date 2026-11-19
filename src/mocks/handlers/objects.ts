import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';
import { IObjectsApiResponse } from '@/api/objects/types';

export const objectsHandlers = [
  // on post to objects service, just return the query
  rest.post(apiHandlerRoute(ApiTargets.SERVICE_OBJECTS_QUERY), async (req, res, ctx) => {
    const { query } = await req.json<{ query: Array<string> }>();

    return res(
      ctx.json({
        query: query.join(' '),
      }),
    );
  }),

  rest.post(apiHandlerRoute(ApiTargets.SERVICE_OBJECTS, ''), async (req, res, ctx) => {
    const { identifiers } = await req.json<{ identifiers: Array<string> }>();

    const resolved = identifiers.reduce<IObjectsApiResponse>(
      (acc, id) => ({ ...acc, [id]: { id, canonical: `Object ${id}` } }),
      {},
    );

    return res(ctx.json(resolved));
  }),
];
