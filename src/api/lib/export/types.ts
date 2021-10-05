import { IADSApiSearchParams, IDocsEntity } from '@api';

/**
 * @see https://github.com/adsabs/export_service#readme
 */
export type ExportApiFormat =
  | 'bibtex'
  | 'ads'
  | 'bibtexabs'
  | 'endnote'
  | 'procite'
  | 'ris'
  | 'refworks'
  | 'rss'
  | 'medlars'
  | 'dcxml'
  | 'refxml'
  | 'refabsxml'
  | 'aastex'
  | 'ieee'
  | 'icarus'
  | 'mnras'
  | 'soph'
  | 'votable'
  | 'custom';

export interface IExportApiParams {
  format: ExportApiFormat;
  bibcode: IDocsEntity['bibcode'][];
  sort?: IADSApiSearchParams['sort'];
  customFormat?: [string];
  authorcutoff?: [number];
  journalformat?: [number];
  maxauthor?: [number];
}

export interface IExportApiResponse {
  export: string;
  msg: string;
}

export const isExportApiFormat = (format: unknown): format is ExportApiFormat => {
  return (
    typeof format === 'string' &&
    [
      'bibtex',
      'ads',
      'bibtexabs',
      'endnote',
      'procite',
      'ris',
      'refworks',
      'rss',
      'medlars',
      'dcxml',
      'refxml',
      'refabsxml',
      'aastex',
      'ieee',
      'icarus',
      'mnras',
      'soph',
      'votable',
      'custom',
    ].includes(format)
  );
};
