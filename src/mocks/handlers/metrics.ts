import { rest } from 'msw';
import { ApiTargets, IADSApiMetricsParams } from '@api';
import { apiHandlerRoute } from '@mocks/mockHelpers';

export const metricsHandlers = [
  rest.post<IADSApiMetricsParams>(apiHandlerRoute(ApiTargets.SERVICE_METRICS), async (req, res, ctx) => {
    return res(
      ctx.status(200),

      ctx.json(await import('../responses/metrics.json')),
    );
  }),
];
