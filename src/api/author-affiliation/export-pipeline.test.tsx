import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryFunctionContext } from '@tanstack/react-query';
import axios from 'axios';
import { ApiRequestConfig } from '@/api/types';
import { fetchAuthorAffiliationExport } from '@/api/author-affiliation/author-affiliation';
import { IAuthorAffiliationExportPayload } from '@/api/author-affiliation/types';
import { exportTypes } from '@/components/AuthorAffiliations/models';
import { useDownloadFile } from '@/lib/useDownloadFile';

const MOCK_API_BASE = 'https://api.example.com';
const JSDOM_SAFE_ADAPTER = 'fetch';

vi.mock('@/api/api', () => ({
  default: {
    request: (config: ApiRequestConfig) =>
      axios.request({ ...config, baseURL: MOCK_API_BASE, adapter: JSDOM_SAFE_ADAPTER }),
  },
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

const defaultURI = 'blob:http://localhost:8000/9303db9e-5b75-4d87-9aa8-804d7e59c29b';
const createObjectURL = vi.fn<(blob: Blob) => string>(() => defaultURI);

window.URL.createObjectURL = createObjectURL;

afterEach(() => {
  vi.clearAllMocks();
});

const OLE2_HEADER = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const EXCEL_FORMAT = exportTypes[2];
const TEXT_FORMAT = exportTypes[4];
const SELECTED = ['Aguilar, J. A.|Universite Libre de Bruxelles|2023/03/01'];

const lastBlob = (): Blob => {
  const call = createObjectURL.mock.calls.at(-1);
  if (!call) {
    throw new Error('URL.createObjectURL was never called');
  }
  return call[0];
};

const readBlobBytes = (blob: Blob) =>
  new Promise<Uint8Array>((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });

const readBlobText = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

const exportFor = (format: IAuthorAffiliationExportPayload['format']) =>
  fetchAuthorAffiliationExport({
    meta: { params: { format, selected: SELECTED } },
    queryKey: [],
    signal: new AbortController().signal,
  } as unknown as QueryFunctionContext);

describe('author-affiliation export pipeline', () => {
  test('an excel export survives the wire and reaches the Blob byte-identical', async () => {
    const data = await exportFor(EXCEL_FORMAT);

    expect(data).toBeInstanceOf(ArrayBuffer);

    const fromWire = new Uint8Array(data as ArrayBuffer);
    expect(fromWire.byteLength).toBeGreaterThan(OLE2_HEADER.length);
    expect(Array.from(fromWire.subarray(0, OLE2_HEADER.length))).toEqual(OLE2_HEADER);

    const { result } = renderHook(() => useDownloadFile(data, { type: 'XLS', filename: 'authoraffiliation' }));

    expect(result.current.linkHref).toEqual(defaultURI);
    expect(result.current.filename).toEqual('authoraffiliation.xls');

    const blob = lastBlob();
    expect(blob.type).toEqual('application/vnd.ms-excel');
    expect(blob.size).toEqual(fromWire.byteLength);

    const fromBlob = await readBlobBytes(blob);
    expect(Array.from(fromBlob)).toEqual(Array.from(fromWire));
  });

  test('the excel bytes would not have survived a text round trip', async () => {
    const data = await exportFor(EXCEL_FORMAT);
    const fromWire = new Uint8Array(data as ArrayBuffer);

    const throughText = new TextEncoder().encode(new TextDecoder('utf-8').decode(fromWire));

    expect(throughText.byteLength).not.toEqual(fromWire.byteLength);
    expect(Array.from(throughText.subarray(0, 4))).not.toEqual(OLE2_HEADER.slice(0, 4));
  });

  test('a text export still arrives as a string and reaches the Blob unchanged', async () => {
    const data = await exportFor(TEXT_FORMAT);

    expect(typeof data).toEqual('string');
    expect(data).toEqual(SELECTED.join('\n'));

    renderHook(() => useDownloadFile(data, { type: 'TEXT', filename: 'authoraffiliation' }));

    const blob = lastBlob();
    expect(blob.type).toEqual('text/plain');
    await expect(readBlobText(blob)).resolves.toEqual(SELECTED.join('\n'));
  });
});
