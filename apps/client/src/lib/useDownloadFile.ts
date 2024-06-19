import { noop } from '@/utils';
import { formatISO } from 'date-fns';
import { saveAs } from 'file-saver';
import { parse } from 'path';
import { isFunction, isNonEmptyString } from 'ramda-adjunct';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface IUseDownloadFileOptions {
  filename?: string | (() => string);
  type?: FileType;
  timeout?: number;
  appendDate?: boolean;
  onDownloaded?: () => void;
}

export const useDownloadFile = (value: string | (() => string), options: IUseDownloadFileOptions = {}) => {
  const { timeout = 300, filename = 'download', appendDate = false, type = 'TEXT', onDownloaded = noop } = options;
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const meta = getMetaData(type);
  const file = getFileName(filename, appendDate, meta);

  // generate URI for the passed in value
  const href = useMemo(() => {
    const content = typeof value === 'function' ? [value()] : [value];
    if (typeof window !== 'undefined' && isNonEmptyString(content[0])) {
      const blob = new window.Blob(content, { type });
      return window.URL.createObjectURL(blob);
    }
    return '';
  }, [value, type]);

  const onDownload = useCallback(() => {
    setIsDownloading(true);

    if (type === 'BROWSER') {
      // generate a link and add it to the dom
      const link = document.createElement('a');
      link.setAttribute('href', href);
      link.setAttribute('download', file);

      // open the link in a new tab
      global.open(link.href, '_blank');
      link.remove();
    } else {
      // save the file
      saveAs(href, file);
    }

    // let subscribers know we finished
    setHasDownloaded(true);

    // call finished callback
    onDownloaded();

    setTimeout(() => setHasDownloaded(false), timeout);
  }, [value, file]);

  useEffect(() => setIsDownloading(false), [hasDownloaded]);

  return { onDownload, hasDownloaded, isDownloading, value, filename: file, linkHref: href };
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
