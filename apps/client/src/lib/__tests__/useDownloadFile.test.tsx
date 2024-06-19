/* eslint-disable @typescript-eslint/unbound-method */
import { useDownloadFile } from '@/lib/useDownloadFile';
import { act, renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

const defaultURI = 'blob:http://localhost:8000/9303db9e-5b75-4d87-9aa8-804d7e59c29b';

vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => defaultURI),
});

vi.stubGlobal('open', vi.fn());

afterEach(() => {
  vi.clearAllMocks();
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
