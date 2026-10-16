import { rest } from 'msw';

import { IAuthorAffiliationExportPayload, IAuthorAffiliationResponse } from '@/api/author-affiliation/types';
import { flatten, range } from 'ramda';
import { apiHandlerRoute, authorAffData, exportAuthorAffData } from '@/mocks/mockHelpers';
import { faker } from '@faker-js/faker';
import { ApiTargets } from '@/api/models';
import { getExportFileType } from '@/components/AuthorAffiliations/models';

const OLE2_HEADER = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const EXCEL_EXPORT_FIXTURE_LENGTH = 256;

const buildExcelExportFixture = () => {
  const bytes = new Uint8Array(EXCEL_EXPORT_FIXTURE_LENGTH);
  bytes.set(OLE2_HEADER, 0);
  for (let i = OLE2_HEADER.length; i < EXCEL_EXPORT_FIXTURE_LENGTH; i += 1) {
    bytes[i] = i % 256;
  }
  return bytes;
};

export const authorAffiliationHandlers = [
  rest.post(apiHandlerRoute(ApiTargets.AUTHOR_AFFILIATION_SEARCH), (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json<IAuthorAffiliationResponse>({
        data: [...flatten(range(0, 10).map(() => authorAffData(faker.number.int({ min: 1, max: 3 }))))],
      }),
    );
  }),

  rest.post<IAuthorAffiliationExportPayload>(
    apiHandlerRoute(ApiTargets.AUTHOR_AFFILIATION_EXPORT),
    async (req, res, ctx) => {
      const { format, selected } = await req.json<IAuthorAffiliationExportPayload>();

      if (getExportFileType(format) === 'XLS') {
        return res(ctx.status(200), ctx.body(buildExcelExportFixture()));
      }

      return res(ctx.status(200), ctx.body(exportAuthorAffData(selected)));
    },
  ),
];
