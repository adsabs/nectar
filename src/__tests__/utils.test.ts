import { normalizeSolrSort } from '@utils';

describe('utils', () => {
  describe('normalizeSolrSort', () => {
    const defaultReturn: ReturnType<typeof normalizeSolrSort> = ['date desc', 'id asc'];
    test.concurrent.each<[string, Parameters<typeof normalizeSolrSort>, ReturnType<typeof normalizeSolrSort>]>([
      ['simple case', [['date asc']], ['date asc', 'id asc']],
      ['garbage with postfix specified', ['lsdjkf', 'citation_count asc'], ['date desc', 'citation_count asc']],
      ['duplicate sort w/ garbage', [['date asc', 'sdljkf', 'date asc']], ['date asc', 'id asc']],
      [
        'simple sort with postfix specified',
        ['citation_count desc', 'author_count asc'],
        ['citation_count desc', 'author_count asc'],
      ],
      ['duplicated default postfix', ['id asc'], ['id asc']],
      [
        'garbage with single valid sort',
        [['lsdjkf', 'citation_count asc', 'sldjkf', 'eejej', NaN, 29393, 'garbage']],
        ['citation_count asc', 'id asc'],
      ],
      ['null input', [null], defaultReturn],
      ['empty array', [[]], defaultReturn],
      [
        'valid string',
        ['citation_count desc,classic_factor asc'],
        ['citation_count desc', 'classic_factor asc', 'id asc'],
      ],
      ['garbage string', [['lksjdf;sldjfk;,sldfj,jksdlf,kd']], defaultReturn],
      [
        'garbage string w/valid sort',
        ['slkdjf,sdlkjf,lskdjf;,sdljkdskj,,,,,,,lsdkjf,score asc,dslkj'],
        ['score asc', 'id asc'],
      ],
    ])('%s', async (_, args, expected) => {
      expect(normalizeSolrSort(...args)).toEqual(expected);
      return Promise.resolve();
    });
  });
});
