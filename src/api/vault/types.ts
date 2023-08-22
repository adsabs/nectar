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
  BIBTEX_FORMAT = 'bibtexKeyFormat',
  DEFAULT_DATABASE = 'defaultDatabase',
  BIBTEX_MAX_AUTHORS = 'bibtexMaxAuthors',
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

export type CustomFormat = { id: string; code: string; name: string };

export enum DatabaseEnum {
  Physics = 'Physics',
  Astronomy = 'Astronomy',
  General = 'General',
}

export enum ExternalLinkAction {
  Auto = 'Auto',
  OpenNewTab = 'Open new tab',
  OpenCurrentTab = 'Open in current tab',
}

export enum JournalFormatName {
  AASTeXMacros = 'Use AASTeX macros',
  Abbreviations = 'Use Journal Abbreviations',
  FullName = 'Use Full Journal Name',
}

export interface IADSApiUserDataResponse {
  [UserDataKeys.HOMEPAGE]: string;
  [UserDataKeys.LINK_SERVER]: string;
  [UserDataKeys.CUSTOM_FORMATS]: CustomFormat[];
  [UserDataKeys.BIBTEX_FORMAT]: string;
  [UserDataKeys.DEFAULT_DATABASE]: { name: DatabaseEnum; value: boolean }[];
  [UserDataKeys.BIBTEX_MAX_AUTHORS]: string;
  [UserDataKeys.LAST_MESSAGE]: string;
  [UserDataKeys.ABS_FORMAT]: string;
  [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: string;
  [UserDataKeys.EXTERNAL_LINK_ACTION]: ExternalLinkAction;
  [UserDataKeys.ABS_MAX_AUTHORS]: string;
  [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: JournalFormatName;
  [UserDataKeys.DEFAULT_EXPORT_FORMAT]: string;
  [UserDataKeys.DEFAULT_HIDE_SIDEBARS]: string;
  [UserDataKeys.MIN_AUTHOR_RESULT]: typeof MinAuthorsPerResultOptions[number];
  [UserDataKeys.ABS_AUTHOR_CUTOFF]: string;
}

export type IADSApiUserDataParams = Partial<IADSApiUserDataResponse>;

export type LibraryLinkServer = {
  gif: string;
  name: string;
  link: string;
};
export type IADSApiLibraryLinkServersResponse = LibraryLinkServer[];
