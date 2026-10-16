import { useDownloadFile } from '@/lib/useDownloadFile';
import { act, renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

const defaultURI = 'blob:http://localhost:8000/9303db9e-5b75-4d87-9aa8-804d7e59c29b';

const createObjectURL = vi.fn<(blob: Blob) => string>(() => defaultURI);

vi.stubGlobal('URL', { createObjectURL });

vi.stubGlobal('open', vi.fn());

afterEach(() => {
  vi.clearAllMocks();
});

const OLE2_HEADER = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const FIXTURE_BYTE_LENGTH = 5632;

const makeOle2Fixture = () => {
  const bytes = new Uint8Array(FIXTURE_BYTE_LENGTH);
  bytes.set(OLE2_HEADER, 0);
  for (let i = OLE2_HEADER.length; i < FIXTURE_BYTE_LENGTH; i += 1) {
    bytes[i] = i % 256;
  }
  return bytes;
};

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

test('the fixture contains byte sequences a utf-8 round trip would destroy', () => {
  const fixture = makeOle2Fixture();
  const mangled = new TextEncoder().encode(new TextDecoder('utf-8').decode(fixture));

  expect(mangled.byteLength).not.toEqual(fixture.byteLength);
  expect(Array.from(mangled.subarray(0, 4))).not.toEqual(OLE2_HEADER.slice(0, 4));
});

test('an ArrayBuffer value reaches the Blob with every byte intact', async () => {
  const fixture = makeOle2Fixture();

  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [fixture.buffer, { type: 'XLS' }],
  });

  expect(result.current.linkHref).toEqual(defaultURI);
  expect(result.current.filename).toEqual('download.xls');

  const blob = lastBlob();
  expect(blob.type).toEqual('application/vnd.ms-excel');
  expect(blob.size).toEqual(FIXTURE_BYTE_LENGTH);

  const bytes = await readBlobBytes(blob);
  expect(bytes.byteLength).toEqual(FIXTURE_BYTE_LENGTH);
  expect(Array.from(bytes.subarray(0, OLE2_HEADER.length))).toEqual(OLE2_HEADER);
  expect(Array.from(bytes)).toEqual(Array.from(fixture));
});

test('a string value still reaches the Blob unchanged', async () => {
  renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: ['author,affiliation\nSmith J.,CfA\n', { type: 'CSV' }],
  });

  const blob = lastBlob();
  expect(blob.type).toEqual('text/csv');
  await expect(readBlobText(blob)).resolves.toEqual('author,affiliation\nSmith J.,CfA\n');
});

test('an rtf value still reaches the Blob unchanged', async () => {
  const rtf = '{\\rtf1\\ansi Smith, J.\\par}';

  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [rtf, { type: 'RTF' }],
  });

  expect(result.current.filename).toEqual('download.rtf');

  const blob = lastBlob();
  expect(blob.type).toEqual('application/rtf;charset=utf-8');
  await expect(readBlobText(blob)).resolves.toEqual(rtf);
});

test('a zero-length ArrayBuffer does not create an href', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [new ArrayBuffer(0), { type: 'XLS' }],
  });

  expect(result.current.linkHref).toEqual('');
  expect(createObjectURL).not.toBeCalled();
});

test('an undefined value does not create an href', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [undefined, { type: 'XLS' }],
  });

  expect(result.current.linkHref).toEqual('');
  expect(createObjectURL).not.toBeCalled();
});

test('Normal case', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: ['test'],
  });

  expect(result.current).toMatchObject({
    hasDownloaded: false,
    isDownloading: false,
    value: 'test',
    filename: 'download.txt',
    linkHref: defaultURI,
  });

  expect(saveAs).not.toBeCalled();
  expect(global.URL.createObjectURL).toBeCalled();
  act(() => result.current.onDownload());
  expect(saveAs).toBeCalledWith(defaultURI, 'download.txt');
  expect(result.current.hasDownloaded).toBeTruthy();
});

test('Browser type', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: ['test', { type: 'BROWSER' }],
  });

  expect(saveAs).not.toBeCalled();
  expect(global.URL.createObjectURL).toBeCalled();
  expect(result.current.hasDownloaded).toBeFalsy();
  act(() => result.current.onDownload());
  expect(global.open).toBeCalledWith(defaultURI, '_blank');
  expect(result.current.hasDownloaded).toBeTruthy();
});

test('takes in a function for the value', () => {
  const makeValue = vi.fn(() => 'foo');
  renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [makeValue, { type: 'TEXT' }],
  });

  expect(makeValue).toBeCalled();
});

test('changing type updates extension', () => {
  const { result, rerender } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: ['test', { type: 'CSV' }],
  });

  expect(result.current.filename).toEqual('download.csv');
  rerender(['test', { type: 'XLS' }]);
  expect(result.current.filename).toEqual('download.xls');
});

test('if filename has extension override type', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: ['test', { type: 'CSV', filename: 'test.txt' }],
  });

  expect(result.current.filename).toEqual('test.txt');
});

test('passing an empty value does not create an href', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [''],
  });

  expect(result.current.linkHref).toEqual('');
});
