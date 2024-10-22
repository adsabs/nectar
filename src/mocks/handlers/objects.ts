import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';

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
];
