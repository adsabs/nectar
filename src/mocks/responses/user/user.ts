import { rest } from 'msw';

export const userHandlers = [
  rest.get('*/api/user', (req, res, ctx) => {
    const test = req.url.searchParams.get('test');

    if (test === 'networkerror') {
      return res.networkError('failure');
    } else if (test === 'fail') {
      return res(ctx.status(500, 'Server Error'));
    }

    return res(
      ctx.status(200),
      ctx.cookie('session', 'test-session'),
      ctx.json({
        user: {
          access_token: 'test',
          expires_at: '9999999999999999',
          anonymous: false,
          username: 'test',
        },
        isAuthenticated: true,
      }),
    );
  }),
];
