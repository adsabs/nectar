import { LibrariesService } from './lib/libraries';
import { SearchService } from './lib/search';
import { UserService } from './lib/user';
import { AccountsService } from './lib/accounts';

export default {
  search: new SearchService(),
  libraries: new LibrariesService(),
  user: new UserService(),
  accounts: new AccountsService(),
};

export { SolrField, SolrSort } from './lib/models';
export {
  IADSApiSearchErrorResponse,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  IDocsEntity,
} from './lib/search/types';

export { IADSApiBootstrapData } from './lib/accounts/types';
