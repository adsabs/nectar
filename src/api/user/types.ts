import { range } from 'ramda';
import { SolrSortField } from '@/api/models';

export interface IADSApiUserResponse {
  [key: string]: unknown;
}

export interface IADSApiUserErrorResponse {
  [key: string]: unknown;
}

export interface IRegisterParams {
  email: string;
  errorMsg: string;
  hasError: boolean;
  password1: string;
  password2: string;
  verify_url: string;
  'g-recaptcha-response': string;
}

export interface IBasicAccountsResponse {
  message: string;
}

export interface IBasicAccountsErrorResponse {
  error: string;
}

export interface ICSRFResponse {
  csrf: string;
}

export interface IBootstrapPayload {
  username: string;
  scopes: string[];
  client_id: string;
  access_token: string;
  client_name: string;
  token_type: string;
  ratelimit: number;
  anonymous: boolean;
  client_secret: string;
  expire_in: string;
  refresh_token: string;
  message?: string;
}

export type IUserData = Pick<IBootstrapPayload, 'username' | 'anonymous' | 'access_token' | 'expire_in'>;

export interface IUserForgotPasswordCredentials {
  email: string;
  recaptcha: string;
}

export interface IUserCredentials {
  email: string;
  password: string;
}

export interface IUserRegistrationCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  recaptcha: string;
}

export interface IAuthLoginResponse {
  success: boolean;
  user?: IUserData;
  error?: string;
}

export interface IUserForgotPasswordCredentials {
  email: string;
  recaptcha: string;
}

export interface IUserChangePasswordCredentials {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export interface IUserChangeEmailCredentials {
  email: string;
  password: string;
}

export interface IUserResetPasswordCredentials {
  password: string;
  confirmPassword: string;
  verifyToken: string;
}

// VERIFY typings
export interface IVerifyAccountResponse {
  message?: 'success';
  email?: string;
  error?: string;
}

export type VerifyRoutes = 'change-email' | 'reset-password' | 'register';

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
  DEFAULT_CITATION_FORMAT = 'defaultCitationFormat', // this is for the one click citation
  DEFAULT_HIDE_SIDEBARS = 'defaultHideSidebars',
  MIN_AUTHOR_RESULT = 'minAuthorsPerResult',
  ABS_AUTHOR_CUTOFF = 'bibtexABSAuthorCutoff',
  PREFERRED_SEARCH_SORT = 'preferredSearchSort',
}

export type CustomFormat = { id: string; code: string; name: string };

export enum DatabaseEnum {
  Physics = 'Physics',
  Astronomy = 'Astronomy',
  General = 'General',
  EarthScience = 'Earth Science',
  All = 'All',
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

export const MinAuthorsPerResultOptions = range(1, 11)
  .map((n) => n.toString())
  .concat(['all']);

export interface IADSApiUserDataResponse {
  [UserDataKeys.HOMEPAGE]: string;
  [UserDataKeys.LINK_SERVER]: string;
  [UserDataKeys.CUSTOM_FORMATS]: CustomFormat[];
  [UserDataKeys.BIBTEX_FORMAT]: string;
  [UserDataKeys.DEFAULT_DATABASE]: Array<{ name: DatabaseEnum; value: boolean }>;
  [UserDataKeys.BIBTEX_MAX_AUTHORS]: string;
  [UserDataKeys.LAST_MESSAGE]: string;
  [UserDataKeys.ABS_FORMAT]: string;
  [UserDataKeys.BIBTEX_AUTHOR_CUTOFF]: string;
  [UserDataKeys.EXTERNAL_LINK_ACTION]: ExternalLinkAction;
  [UserDataKeys.ABS_MAX_AUTHORS]: string;
  [UserDataKeys.BIBTEX_JOURNAL_FORMAT]: JournalFormatName;
  [UserDataKeys.DEFAULT_EXPORT_FORMAT]: string;
  [UserDataKeys.DEFAULT_CITATION_FORMAT]: string;
  [UserDataKeys.DEFAULT_HIDE_SIDEBARS]: string;
  [UserDataKeys.MIN_AUTHOR_RESULT]: typeof MinAuthorsPerResultOptions[number];
  [UserDataKeys.ABS_AUTHOR_CUTOFF]: string;
  [UserDataKeys.PREFERRED_SEARCH_SORT]: SolrSortField;
}

export type IADSApiUserDataParams = Partial<IADSApiUserDataResponse>;
