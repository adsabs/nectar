import { rest } from 'msw';
import { ApiTargets, ExportApiFormatKey, IExportApiParams } from '@/api';
import { apiHandlerRoute } from '@/mocks/mockHelpers';

export const exportHandlers = [
  rest.post<IExportApiParams, { format: ExportApiFormatKey }>(
    apiHandlerRoute(ApiTargets.EXPORT, '/:format'),
    (req, res, ctx) => {
      const { bibcode, ...body } = req.body;
      const { format } = req.params;

      const value = { numRecords: bibcode.length, format, ...body };

      return res(
        ctx.delay(200),
        ctx.status(200),
        ctx.json({
          export: `${JSON.stringify(value, Object.keys(value).sort(), 2)}`,
        }),
      );
    },
  ),
];
