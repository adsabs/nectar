import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';

export const accountHandlers = [
  rest.get(apiHandlerRoute(ApiTargets.BOOTSTRAP), (req, res, ctx) => {
    const test = req.url.searchParams.get('test');
    const scenario = req.headers.get('x-test-scenario');

    if (test === 'networkerror' || scenario === 'bootstrap-network-error') {
      return res.networkError('failure');
    }

    if (test === 'fail' || scenario === 'bootstrap-failure') {
      return res(ctx.status(500, 'Server Error'));
    }

    // Default to authenticated for easier development/testing
    if (scenario !== 'bootstrap-anonymous') {
      return res(
        ctx.status(200),
        ctx.set('Set-Cookie', 'ads_session=authenticated-session; Domain=example.com; SameSite=None; Secure'),
        ctx.json({
          username: 'test@example.com',
          scopes: ['api', 'execute-query', 'store-query', 'user'],
          client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
          access_token: 'mocked-authenticated-token',
          client_name: 'BB client',
          token_type: 'Bearer',
          ratelimit: 1.0,
          anonymous: false,
          client_secret: 'ly8MkAN34LBNDwco3Ptl4tPMFuNzsEzMXGS8KYMneokpZsSYrVgSrs1lJJx7',
          expires_at: '999999999999999999',
          refresh_token: 'BENF2Gu2EXDXreAjzkiDoV7ReXaNisy4j9kn088u',
          given_name: 'Test',
          family_name: 'User',
        }),
      );
    }

    if (scenario === 'bootstrap-rotated-cookie') {
      const currentCookie = req.headers.get('cookie');
      const newCookie = currentCookie ? `${currentCookie}-rotated` : 'rotated-session';
      return res(
        ctx.status(200),
        ctx.set('Set-Cookie', `ads_session=${newCookie}; Domain=example.com; SameSite=None; Secure`),
        ctx.json({
          username: 'anonymous@ads',
          scopes: ['api', 'execute-query', 'store-query'],
          client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
          access_token: 'mocked-anonymous-token',
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
    }

    if (scenario === 'bootstrap-unchanged-cookie') {
      return res(
        ctx.status(200),
        ctx.set('Set-Cookie', 'ads_session=unchanged-session; Domain=example.com; SameSite=None; Secure'),
        ctx.json({
          username: 'anonymous@ads',
          scopes: ['api', 'execute-query', 'store-query'],
          client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
          access_token: 'mocked-anonymous-token',
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
    }

    return res(
      ctx.status(200),
      ctx.set('Set-Cookie', 'ads_session=test-session; Domain=example.com; SameSite=None; Secure'),
      ctx.json({
        username: 'anonymous@ads',
        scopes: ['api', 'execute-query', 'store-query'],
        client_id: 'ONsfcxVTNIae5vULWlH7bLE8F6MpIZgW0Bhghzny',
        access_token: 'mocked-anonymous-token',
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
    const scenario = req.headers.get('x-test-scenario');

    if (mode === 'unknown' || scenario === 'verify-unknown-token') {
      return res(ctx.status(200), ctx.json({ error: 'unknown verification token' }));
    }

    if (mode === 'validated' || scenario === 'verify-already-validated') {
      return res(ctx.status(200), ctx.json({ error: 'already been validated' }));
    }

    if (scenario === 'verify-failure') {
      return res(ctx.status(500, 'Server Error'));
    }

    if (scenario === 'verify-network-error') {
      return res.networkError('failure');
    }

    return res(
      ctx.status(200),
      ctx.set('Set-Cookie', `ads_session=verified-${token}; Domain=example.com; SameSite=None; Secure`),
      ctx.json({ message: 'success', email: 'verified@example.com' }),
    );
  }),
];
