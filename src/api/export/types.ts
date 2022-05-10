import { IADSApiSearchParams, IDocsEntity } from '@api';

/**
 * @see https://github.com/adsabs/export_service#readme
 */

export const MAX_AUTHORCUTOFF = 500 as const;
export const BIBTEX_DEFAULT_MAX_AUTHOR = 10 as const;
export const BIBTEX_ABS_DEFAULT_MAX_AUTHOR = 0 as const;
export const BIBTEX_DEFAULT_AUTHOR_CUTOFF = 200 as const;

export enum ExportApiFormatKey {
  bibtex = 'bibtex',
  ads = 'ads',
  bibtexabs = 'bibtexabs',
  endnote = 'endnote',
  procite = 'procite',
  ris = 'ris',
  refworks = 'refworks',
  rss = 'rss',
  medlars = 'medlars',
  dcxml = 'dcxml',
  refxml = 'refxml',
  refabsxml = 'refabsxml',
  aastex = 'aastex',
  ieee = 'ieee',
  icarus = 'icarus',
  mnras = 'mnras',
  soph = 'soph',
  votable = 'votable',
  custom = 'custom',
}

export enum ExportApiErrorKey {
  NO_RESULT = 'no result from solr',
  QUERY_ISSUE = 'unable to query solr',
  NO_INFO = 'no information received',
  FORMAT_UNREADABLE = 'unable to read custom format',
}

export enum ExportApiJournalFormat {
  AASTeXMacros = 1,
  Abbreviations = 2,
  FullName = 3,
}

export interface IExportApiParams {
  format: ExportApiFormatKey;
  customFormat?: string;
  bibcode: IDocsEntity['bibcode'][];
  sort?: IADSApiSearchParams['sort'];
  authorcutoff?: [number];
  journalformat?: [ExportApiJournalFormat];
  maxauthor?: [number];
}

export interface IExportApiResponse {
  export: string;
  msg: string;
  error?: ExportApiErrorKey;
}

export const isExportApiFormat = (format: unknown): format is ExportApiFormatKey => {
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
