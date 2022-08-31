import { APP_DEFAULTS } from '@config';
import { normalizeSolrSort } from '@utils';
import { describe, expect, test } from 'vitest';

const defaultSortPostfix = APP_DEFAULTS.QUERY_SORT_POSTFIX;

describe('utils', () => {
  describe('normalizeSolrSort', () => {
    const defaultReturn: ReturnType<typeof normalizeSolrSort> = ['date desc', defaultSortPostfix];
    test.concurrent.each<[string, Parameters<typeof normalizeSolrSort>, ReturnType<typeof normalizeSolrSort>]>([
      ['simple case', [['date asc']], ['date asc', defaultSortPostfix]],
      ['garbage with postfix specified', ['lsdjkf', 'citation_count asc'], ['date desc', 'citation_count asc']],
      ['duplicate sort w/ garbage', [['date asc', 'sdljkf', 'date asc']], ['date asc', defaultSortPostfix]],
      [
        'simple sort with postfix specified',
        ['citation_count desc', 'author_count asc'],
        ['citation_count desc', 'author_count asc'],
      ],
      ['duplicated default postfix', [defaultSortPostfix], [defaultSortPostfix]],
      [
        'garbage with single valid sort',
        [['lsdjkf', 'citation_count asc', 'sldjkf', 'eejej', NaN, 29393, 'garbage']],
        ['citation_count asc', defaultSortPostfix],
      ],
      ['null input', [null], defaultReturn],
      ['empty array', [[]], defaultReturn],
      [
        'valid string',
        ['citation_count desc,classic_factor asc'],
        ['citation_count desc', 'classic_factor asc', defaultSortPostfix],
      ],
      ['garbage string', [['lksjdf;sldjfk;,sldfj,jksdlf,kd']], defaultReturn],
      [
        'garbage string w/valid sort',
        ['slkdjf,sdlkjf,lskdjf;,sdljkdskj,,,,,,,lsdkjf,score asc,dslkj'],
        ['score asc', defaultSortPostfix],
      ],
    ])('%s', async (_, args, expected) => {
      expect(normalizeSolrSort(...args)).toEqual(expected);
      return Promise.resolve();
    });
  });
});
