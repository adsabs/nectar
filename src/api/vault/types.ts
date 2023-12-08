export interface IADSVaultExecuteQueryParams {
  qid: string;
}

export interface IADSApiVaultResponse {
  qid: string;
  numfound: number;
}

export type LibraryLinkServer = {
  gif: string;
  name: string;
  link: string;
};
export type IADSApiLibraryLinkServersResponse = LibraryLinkServer[];
