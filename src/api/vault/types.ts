import { range } from 'ramda';

export interface IADSVaultExecuteQueryParams {
  qid: string;
}

export interface IADSApiVaultResponse {
  qid: string;
  numfound: number;
}

export enum UserDataKeys {
  HOMEPAGE = 'homePage',
  LINK_SERVER = 'link_server',
  CUSTOM_FORMATS = 'customFormats',
  BIBTEXT_FORMAT = 'bibtexKeyFormat',
  DEFAULT_DATABASE = 'defaultDatabase',
  BIBTEXT_MAX_AUTHORS = 'bibtexMaxAuthors',
  LAST_MESSAGE = 'last_seen_message',
  ABS_FORMAT = 'bibtexABSKeyFormat',
  BIBTEX_AUTHOR_CUTOFF = 'bibtexAuthorCutoff',
  EXTERNAL_LINK_ACTION = 'externalLinkAction',
  ABS_MAX_AUTHORS = 'bibtexABSMaxAuthors',
  BIBTEX_JOURNAL_FORMAT = 'bibtexJournalFormat',
  DEFAULT_EXPORT_FORMAT = 'defaultExportFormat',
  DEFAULT_HIDE_SIDEBARS = 'defaultHideSidebars',
  MIN_AUTHOR_RESULT = 'minAuthorsPerResult',
  ABS_AUTHOR_CUTOFF = 'bibtexABSAuthorCutoff',
}

export const MinAuthorsPerResultOptions = range(1, 11)
  .map((n) => n.toString())
  .concat(['all']);
export const ExternalLinkActionOptions = ['Auto', 'Open new tab', 'Open in current tab'];
export const Databases = ['Physics', 'Astronomy', 'General'];
export type CustomFormat = { id: string; code: string; name: string };

export interface IADSApiUserDataResponse {
  [UserDataKeys.HOMEPAGE]: string;
  [UserDataKeys.LINK_SERVER]: string;
  [UserDataKeys.CUSTOM_FORMATS]: CustomFormat[];
  [UserDataKeys.BIBTEXT_FORMAT]: string;
  [UserDataKeys.DEFAULT_DATABASE]: { name: typeof Databases[number]; value: boolean }[];
  [UserDataKeys.BIBTEXT_MAX_AUTHORS]: string;
  [UserDataKeys.LAST_MESSAGE]: string;
  [UserDataKeys.ABS_FORMAT]: string;
  [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: string;
  [UserDataKeys.EXTERNAL_LINK_ACTION]: typeof ExternalLinkActionOptions[number];
  [UserDataKeys.ABS_MAX_AUTHORS]: string;
  [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: string;
  [UserDataKeys.DEFAULT_EXPORT_FORMAT]: string;
  [UserDataKeys.DEFAULT_HIDE_SIDEBARS]: string;
  [UserDataKeys.MIN_AUTHOR_RESULT]: typeof MinAuthorsPerResultOptions[number];
  [UserDataKeys.ABS_AUTHOR_CUTOFF]: string;
}

export type IADSApiUserDataParams = Partial<IADSApiUserDataResponse>;
