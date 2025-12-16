import { rest } from 'msw';

export const analyticsHandlers = [
  rest.get('*/link_gateway/*', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: 'ok' }));
  }),
];
