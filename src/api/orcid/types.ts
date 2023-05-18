export interface IOrcidProfile {
  identifier: string;
  status: string;
  title: string;
  pubyear: string;
  pubmonth: null | string;
  updated: Date;
  putcode: number;
  source: string[];
}

interface IOrcidWork {
  'put-code': number;

  [key: string]: unknown;
}

export interface IOrcidResponse {
  exchangeToken: IOrcidUser;
  profile: Record<string, IOrcidProfile>;
  updateWork: Record<string, unknown>;
  removeWorks: null;
  addWorks: Record<string, unknown>;
  name: Record<string, unknown>;
  preferences: Record<string, unknown>;
}

export interface IOrcidParams {
  exchangeToken: { code: string };
  profile: { user: IOrcidUser; full?: boolean; update?: boolean };
  updateWork: { user: IOrcidUser; work: IOrcidWork };
  removeWorks: { user: IOrcidUser; works: string[] };
  addWorks: { user: IOrcidUser; works: string[] };
  preferences: { user: IOrcidUser };
  name: { user: IOrcidUser };
}

export interface IOrcidUser {
  access_token: string;
  expires_in: number;
  name: string;
  orcid: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}
