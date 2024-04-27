import type { IOrcidUser } from '@/api/orcid/types/orcid-user';
import type { IOrcidProfile } from '@/api/orcid/types/orcid-profile';
import type { IOrcidName } from '@/api/orcid/types/orcid-name';
import type { IOrcidWork } from '@/api/orcid/types/orcid-work';
import { IOrcidPreferences } from '@/api/orcid/types/orcid-preferences';
import { OrcidErrorResponse } from '@/api/orcid/types/common';

export type { IOrcidWork } from './orcid-work';
export type { IOrcidProfile } from './orcid-profile';
export type { IOrcidUser } from './orcid-user';
export type { IOrcidName } from './orcid-name';

export interface IOrcidResponse {
  exchangeToken: IOrcidUser;
  profile: IOrcidProfile;
  updateWork: IOrcidWork;

  /** orcid does not return a response on delete, so return the status */
  removeWorks: Record<string, PromiseSettledResult<void>>;
  addWorks: Record<
    string,
    { status: 'fulfilled'; value: IOrcidWork } | { status: 'rejected'; reason: OrcidErrorResponse }
  >;
  name: IOrcidName;
  getPreferences: IOrcidPreferences;
  setPreferences: IOrcidPreferences;
  getWork: IOrcidWork;
}

export interface IOrcidParams {
  exchangeToken: { code: string };
  profile: { user: IOrcidUser; full?: boolean; update?: boolean };
  removeWorks: { putcodes: IOrcidWork['put-code'][] };
  addWorks: { works: unknown[] };
  getWork: { user: IOrcidUser; putcode: IOrcidWork['put-code'] };
  getPreferences: { user: IOrcidUser };
  name: { user: IOrcidUser };
}

export interface IOrcidMutationParams {
  updateWork: {
    params: { user: IOrcidUser };
    variables: { work: IOrcidWork };
  };
  addWorks: {
    params: { user: IOrcidUser };
    variables: { works: IOrcidWork[] };
  };
  removeWorks: {
    params: { user: IOrcidUser };
    variables: { putcodes: IOrcidWork['put-code'][] };
  };
  setPreferences: {
    params: { user: IOrcidUser };
    variables: { preferences: IOrcidPreferences };
  };
}
