import { ApiTargets } from '@api';
import { rest } from 'msw';

const apiHandlerRoute = (key: ApiTargets, path?: string) => `*${key}${typeof path === 'string' ? path : '*'}`;
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
