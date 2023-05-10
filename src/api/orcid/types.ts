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
}

export interface IOrcidParams {
  exchangeToken: { code: string };
  profile: { orcid: string; full?: boolean; update?: boolean };
  updateWork: { orcid: string; work: IOrcidWork };
  removeWorks: { orcid: string; works: string[] };
  addWorks: { orcid: string; works: string[] };
  name: { orcid: string };
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
