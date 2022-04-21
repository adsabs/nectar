import { useCallback, useMemo, useState } from 'react';

interface IuseDownloadFileOptions {
  filename?: string | (() => string);
  timeout?: number;
}

export const useDownloadFile = (value: string, options?: IuseDownloadFileOptions) => {
  const { timeout = 1000 } = options;
  const [hasDownloaded, setHasDownloaded] = useState(false);

  const filename = useMemo(() => {
    if (typeof options.filename === 'function') {
      return options.filename();
    }
    return options.filename;
  }, [options.filename]);

  const onDownload = useCallback(() => {
    const blob = new Blob([value], {
      type: 'text/plain;charset=utf-8',
    });
    const link = document.createElement('a');
    link.setAttribute('href', window.URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.click();
    setHasDownloaded(true);
    link.remove();
    setTimeout(() => setHasDownloaded(false), timeout);
  }, [value, filename]);

  return { onDownload, hasDownloaded, value };
};
