import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';

export const accountHandlers = [
  rest.get(apiHandlerRoute(ApiTargets.BOOTSTRAP), (req, res, ctx) => {
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
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
        access_token: '------ mocked token ---------',
        client_name: 'BB client',
        token_type: 'Bearer',
        ratelimit: 1.0,
        anonymous: true,
        client_secret: 'ly8MkAN34LBNDwco3Ptl4tPMFuNzsEzMXGS8KYMneokpZsSYrVgSrs1lJJx7',
        expires_at: '999999999999999999',
        refresh_token: 'BENF2Gu2EXDXreAjzkiDoV7ReXaNisy4j9kn088u',
        given_name: 'Test T.',
        family_name: 'Tester',
      }),
    );
  }),
  rest.get('*/accounts/verify/:token', (req, res, ctx) => {
    const token = req.params.token as string;
    const mode = req.url.searchParams.get('mode');

    if (mode === 'unknown') {
      return res(ctx.status(200), ctx.json({ error: 'unknown verification token' }));
    }

    if (mode === 'validated') {
      return res(ctx.status(200), ctx.json({ error: 'already been validated' }));
    }

    return res(
      ctx.status(200),
      ctx.cookie('session', `verified-${token}`),
      ctx.json({ message: 'success', email: 'verified@example.com' }),
    );
  }),
];
