import { Adsapi } from './lib/api';
export default Adsapi;

export type { IUserData } from './lib/bootstrap/types';
export type { SolrField, SolrSort, SolrSortDirection, SolrSortField } from './lib/models';
export type {
  IADSApiSearchErrorResponse,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  IDocsEntity,
} from './lib/search/types';
