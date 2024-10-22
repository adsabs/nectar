import { rest } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import resolverAllResponse from '../responses/resolver/all.json';
import { IADSApiResolverParams } from '@/api/resolver/types';
import { ApiTargets } from '@/api/models';

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
