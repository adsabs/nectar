import { rest } from 'msw';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';
import { DEFAULT_USER_DATA } from '@/api/user/models';

export const userSettingsHandlers = [
  // Site-wide message (usually empty for dev)
  rest.get(apiHandlerRoute(ApiTargets.SITE_SIDE_MESSAGE), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({}));
  }),

  rest.get(apiHandlerRoute(ApiTargets.USER_DATA), (req, res, ctx) => {
    const scenario = req.headers.get('x-test-scenario');

    if (scenario === 'settings-network-error') {
      return res.networkError('failure');
    }

    if (scenario === 'settings-failure') {
      return res(ctx.status(500, 'Server Error'));
    }

    // Return settings with sample custom formats for testing
    return res(
      ctx.status(200),
      ctx.json({
        ...DEFAULT_USER_DATA,
        customFormats: [
          { id: '1', name: 'Author Year Title', code: '%1H %Y %T' },
          { id: '2', name: 'BibCode Only', code: '%R' },
          { id: '3', name: 'Full Citation', code: '%1H:%Y:%q' },
          { id: '4', name: 'Short Reference', code: '%1H %Y' },
        ],
      }),
    );
  }),

  rest.post(apiHandlerRoute(ApiTargets.USER_DATA), (req, res, ctx) => {
    // Echo back the settings that were saved
    return res(ctx.status(200), ctx.json(req.body));
  }),
];
