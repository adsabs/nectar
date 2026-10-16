import { describe, expect, test } from 'vitest';
import { ApiTargets } from '@/api/models';
import { IAuthorAffiliationExportPayload } from '@/api/author-affiliation/types';
import { exportTypes } from '@/components/AuthorAffiliations/models';

const OLE2_HEADER = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

const EXCEL_FORMATS = exportTypes.filter((format) => format.includes('[excel]'));
const NON_EXCEL_FORMATS = exportTypes.filter((format) => !format.includes('[excel]'));

const postExport = (format: IAuthorAffiliationExportPayload['format']) =>
  fetch(`https://api.example.com${ApiTargets.AUTHOR_AFFILIATION_EXPORT}`, {
    method: 'POST',
    body: JSON.stringify({ format, selected: ['Aguilar, J. A.|Universite Libre de Bruxelles|2023/03/01'] }),
  });

describe('author-affiliation export mock handler', () => {
  test('the format list splits into two excel and four non-excel formats', () => {
    expect(EXCEL_FORMATS).toHaveLength(2);
    expect(NON_EXCEL_FORMATS).toHaveLength(4);
  });

  test.each(EXCEL_FORMATS)('serves OLE2 bytes for %s', async (format) => {
    const res = await postExport(format);
    expect(res.status).toEqual(200);

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(OLE2_HEADER.length);
    expect(Array.from(bytes.subarray(0, OLE2_HEADER.length))).toEqual(OLE2_HEADER);
  });

  test.each(EXCEL_FORMATS)('the bytes served for %s survive no utf-8 round trip', async (format) => {
    const res = await postExport(format);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const mangled = new TextEncoder().encode(new TextDecoder('utf-8').decode(bytes));

    expect(mangled.byteLength).not.toEqual(bytes.byteLength);
  });

  test.each(NON_EXCEL_FORMATS)('serves text for %s', async (format) => {
    const res = await postExport(format);
    expect(res.status).toEqual(200);

    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(bytes.subarray(0, OLE2_HEADER.length))).not.toEqual(OLE2_HEADER);

    const text = new TextDecoder('utf-8').decode(bytes);
    expect(text).not.toContain('�');
    expect(text.length).toBeGreaterThan(0);
  });
});
