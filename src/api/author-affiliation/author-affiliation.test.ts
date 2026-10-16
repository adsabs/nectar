import { beforeEach, describe, expect, test, vi } from 'vitest';
import { QueryFunctionContext } from '@tanstack/react-query';
import api from '@/api/api';
import { ApiTargets } from '@/api/models';
import { fetchAuthorAffiliationExport } from '@/api/author-affiliation/author-affiliation';
import { IAuthorAffiliationExportPayload } from '@/api/author-affiliation/types';
import { exportTypeFileMappings, exportTypes } from '@/components/AuthorAffiliations/models';

vi.mock('@/api/api', () => ({
  default: { request: vi.fn().mockResolvedValue({ data: '' }) },
}));

const request = vi.mocked(api.request);

const selected = ['Aguilar, J. A.|Universite Libre de Bruxelles|2023/03/01'];

const ctx = (params: IAuthorAffiliationExportPayload) =>
  ({ meta: { params }, queryKey: [], signal: new AbortController().signal } as unknown as QueryFunctionContext);

const configFor = async (format: IAuthorAffiliationExportPayload['format']) => {
  await fetchAuthorAffiliationExport(ctx({ format, selected }));
  return request.mock.calls[0][0];
};

const EXCEL_FORMATS = exportTypes.filter((format) => format.includes('[excel]'));
const NON_EXCEL_FORMATS = exportTypes.filter((format) => !format.includes('[excel]'));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchAuthorAffiliationExport', () => {
  test('both excel formats exist in the format list', () => {
    expect(EXCEL_FORMATS).toHaveLength(2);
    expect(NON_EXCEL_FORMATS).toHaveLength(4);
  });

  test('the XLS mapping stays aligned with the [excel] labels', () => {
    expect(exportTypeFileMappings).toHaveLength(exportTypes.length);

    const excelLabelIndices = exportTypes.flatMap((format, i) => (format.includes('[excel]') ? [i] : []));
    const xlsMappingIndices = exportTypeFileMappings.flatMap((fileType, i) => (fileType === 'XLS' ? [i] : []));

    expect(xlsMappingIndices).toEqual(excelLabelIndices);
  });

  test.each(EXCEL_FORMATS)('requests arraybuffer for %s', async (format) => {
    const config = await configFor(format);

    expect(config.url).toEqual(ApiTargets.AUTHOR_AFFILIATION_EXPORT);
    expect(config.method).toEqual('POST');
    expect(config.responseType).toEqual('arraybuffer');
  });

  test.each(NON_EXCEL_FORMATS)('does not set responseType for %s', async (format) => {
    const config = await configFor(format);

    expect(config.url).toEqual(ApiTargets.AUTHOR_AFFILIATION_EXPORT);
    expect(config.method).toEqual('POST');
    expect(config.responseType).toBeUndefined();
  });

  test('still posts the selected authors and format', async () => {
    const format = exportTypes[2];
    const config = await configFor(format);

    expect(config.data).toEqual({ format, selected });
  });
});
