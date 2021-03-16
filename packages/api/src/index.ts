import { config } from 'dotenv';
import { resolve } from 'path';
import { LibrariesService } from './lib/libraries';
import { SearchService } from './lib/search';
import { UserService } from './lib/user';

config({
  path: resolve(__dirname, '../../../.env'),
});

export default {
  search: new SearchService(),
  libraries: new LibrariesService(),
  user: new UserService(),
};
