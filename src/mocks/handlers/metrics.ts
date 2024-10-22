import { rest } from 'msw';

import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IADSApiMetricsParams } from '@/api/metrics/types';
import { ApiTargets } from '@/api/models';

export const metricsHandlers = [
  rest.post<IADSApiMetricsParams>(apiHandlerRoute(ApiTargets.SERVICE_METRICS), async (req, res, ctx) => {
    return res(
      ctx.status(200),

      ctx.json(await import('../responses/metrics.json')),
    );
  }),
];
