import { IADSApiSearchParams } from '../search/types';

export interface IADSApiVaultParams {
  q: IADSApiSearchParams['q'];
  sort?: IADSApiSearchParams['sort'];
}

export interface IADSApiVaultResponse {
  qid: string;
}
