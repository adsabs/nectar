import { useDownloadFile } from '@hooks/useDownloadFile';
import { renderHook } from '@testing-library/react';
import { saveAs } from 'file-saver';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

test('Normal case', () => {
  const { result } = renderHook((props: Parameters<typeof useDownloadFile>) => useDownloadFile(...props), {
    initialProps: [''],
  });

  expect(result.current).toMatchObject({
    hasDownloaded: false,
    isDownloading: false,
    value: '',
    filename: 'download.txt',
    linkHref: '',
  });

  result.current.onDownload();

  console.log(result, saveAs);
});
