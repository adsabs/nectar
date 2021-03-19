import { LibrariesService } from './lib/libraries';
import { SearchService } from './lib/search';
import { UserService } from './lib/user';

export default {
  search: new SearchService(),
  libraries: new LibrariesService(),
  user: new UserService(),
};

export { SolrField, SolrSort } from './lib/models';
export {
  IADSApiSearchErrorResponse,
  IADSApiSearchParams,
  IADSApiSearchResponse,
  IDocsEntity,
} from './lib/search/types';
