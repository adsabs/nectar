import { IADSApiSearchParams, IDocsEntity } from '@/api/search/types';

/**
 * @see https://github.com/adsabs/export_service#readme
 */

export enum ExportApiFormatKey {
  aastex = 'aastex',
  ads = 'ads',
  agu = 'agu',
  ams = 'ams',
  bibtex = 'bibtex',
  bibtexabs = 'bibtexabs',
  custom = 'custom',
  dcxml = 'dcxml',
  endnote = 'endnote',
  gsa = 'gsa',
  icarus = 'icarus',
  ieee = 'ieee',
  jatsxml = 'jatsxml',
  medlars = 'medlars',
  mnras = 'mnras',
  procite = 'procite',
  refabsxml = 'refabsxml',
  refworks = 'refworks',
  refxml = 'refxml',
  ris = 'ris',
  rss = 'rss',
  soph = 'soph',
  votable = 'votable',
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

export interface IExportFormat {
  name: string;
  type: 'text' | 'custom' | 'XML' | 'HTML' | 'tagged' | 'LaTeX';
  route: string;
}

export type ExportFormatsApiResponse = IExportFormat[];

export interface IExportApiParams {
  // format: ExportApiFormatKey;
  format: string;
  customFormat?: string;
  bibcode: IDocsEntity['bibcode'][];
  sort?: IADSApiSearchParams['sort'];
  authorcutoff?: [number];
  keyformat?: [string];
  journalformat?: [ExportApiJournalFormat];
  maxauthor?: [number];
}

export interface IExportApiResponse {
  export: string;
  msg: string;
  error?: ExportApiErrorKey;
}
