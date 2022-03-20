import { rest } from 'msw';

export const handlers = [
  rest.get('/search/query', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({}));
  }),
];
