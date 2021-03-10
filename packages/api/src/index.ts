import { config } from 'dotenv';
import { resolve } from 'path';
import { SearchService } from './lib/search';

config({
  path: resolve(__dirname, '../../../.env'),
});

export default {
  search: new SearchService(),
};
