import { rest } from 'msw';
import { ApiTargets, IADSApiVaultResponse } from '@api';
import { apiHandlerRoute } from '@mocks/mockHelpers';

export const myadsHandlers = [
  rest.post(apiHandlerRoute(ApiTargets.MYADS_STORAGE, 'query'), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<IADSApiVaultResponse>({
        qid: '012345690',
        numfound: 10,
      }),
    );
  }),
];
