import { rest } from 'msw';
import { ApiTargets } from '@/api';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IADSApiResolverParams } from '@/api/resolver';
import resolverAllResponse from '../responses/resolver/all.json';

export const resolverHandlers = [
  rest.get<IADSApiResolverParams, { bibcode: string; link_type: string }>(
    apiHandlerRoute(ApiTargets.RESOLVER, '/:bibcode/:link_type'),
    (req, res, ctx) => {
      return res(
        ctx.delay(200),
        ctx.status(200),
        ctx.json({
          ...resolverAllResponse,
          __test__: {
            params: req.params,
          },
        }),
      );
    },
  ),
];
