import { rest } from 'msw';

import { IAuthorAffiliationExportPayload, IAuthorAffiliationResponse } from '@/api/author-affiliation/types';
import { flatten, range } from 'ramda';
import { apiHandlerRoute, authorAffData } from '@/mocks/mockHelpers';
import faker from '@faker-js/faker';
import { ApiTargets } from '@/api/models';

export const authorAffiliationHandlers = [
  rest.post(apiHandlerRoute(ApiTargets.AUTHOR_AFFILIATION_SEARCH), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<IAuthorAffiliationResponse>({
        data: [...flatten(range(0, 10).map(() => authorAffData(faker.datatype.number({ min: 1, max: 3 }))))],
      }),
    );
  }),

  rest.post<IAuthorAffiliationExportPayload>(apiHandlerRoute(ApiTargets.AUTHOR_AFFILIATION_EXPORT), (req, res, ctx) => {
    return res(ctx.status(200), ctx.json('success'));
  }),
];
