import { noop } from '@utils';
import { formatISO } from 'date-fns';
import { parse } from 'path';
import { isFunction } from 'ramda-adjunct';
import { useCallback, useEffect, useState } from 'react';
import { useIsClient } from './useIsClient';

interface IuseDownloadFileOptions {
  filename?: string | (() => string);
  type?: FileType;
  timeout?: number;
  appendDate?: boolean;
  onDownloaded?: () => void;
}

export const useDownloadFile = (value: string | (() => string), options?: IuseDownloadFileOptions) => {
  const { timeout = 300, filename = 'download.txt', appendDate = false, type = 'TEXT', onDownloaded = noop } = options;
  const isClient = useIsClient();
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [href, setHref] = useState('');
  const meta = getMetaData(type);
  const file = getFileName(filename, appendDate, meta);

  useEffect(() => {
    if (value && type) {
      setHref(createUrl(value, getMetaData(type)[0]));
    }
  }, [value, type]);

  const onDownload = useCallback(() => {
    setIsDownloading(true);

    // generate a link and add it to the dom
    const link = document.createElement('a');
    link.setAttribute('href', href);
    link.setAttribute('download', file);

    // if browser type, open new tab, otherwise click link to start download
    type === 'BROWSER' && isClient ? window.open(link.href, '_blank') : link.click();

    // let subscribers know we finished
    setHasDownloaded(true);

    // call finished callback
    onDownloaded();

    link.remove();
    setTimeout(() => setHasDownloaded(false), timeout);
  }, [value, file]);

  useEffect(() => setIsDownloading(false), [hasDownloaded]);

  return { onDownload, hasDownloaded, isDownloading, value, filename: file, linkHref: href };
};

const createUrl = (value: string | (() => string), type: string) => {
  const content = typeof value === 'function' ? value() : value;
  const blob = new Blob([content], { type });
  return window.URL.createObjectURL(blob);
};

const getDateString = () => formatISO(new Date());
const getFileName = (filename: string | (() => string), appendDate: boolean, meta: Meta) => {
  const file = parse(isFunction(filename) ? filename() : filename);

  // if the filename contains an extension, use that instead
  if (file.ext.length > 0) {
    return `${file.name}${appendDate ? `_${getDateString()}` : ''}${file.ext}`;
  }
  return `${file.name}${appendDate ? `_${getDateString()}` : ''}${meta?.[1] ?? file.ext}`;
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
 */
export const fileTypes = {
  CSV: 'CSV',
  XLS: 'XLS',
  TEXT: 'TEXT',
  BROWSER: 'BROWSER',
} as const;
export type FileType = keyof typeof fileTypes;
type Meta = [string, string?];
const getMetaData = (type: FileType): Meta => {
  switch (type) {
    case 'CSV':
      return ['text/csv', '.csv'];
    case 'XLS':
      return ['application/vnd.ms-excel', '.xls'];
    case 'BROWSER':
    case 'TEXT':
      return ['text/plain', '.txt'];
    default:
      return ['text/plain', '.txt'];
  }
};
