import { config } from 'dotenv';
import { resolve } from 'path';
import { ArticlesService } from './lib/articles';

config({
  path: resolve(__dirname, '../../../.env'),
});

export default {
  articles: new ArticlesService(),
};
