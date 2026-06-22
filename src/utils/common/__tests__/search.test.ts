import { describe, expect, test } from 'vitest';
import { getDefaultSortForQuery } from '@/utils/common/search';
import { SolrSort } from '@/api/models';

const PREF_SORT: SolrSort[] = ['date desc', 'score desc'];

describe('getDefaultSortForQuery', () => {
  describe('second-order operator queries — returns score desc', () => {
    test.each([
      ['trending(collection:astronomy)', 'trending'],
      ['reviews(author:kurtz)', 'reviews'],
      ['useful(author:kurtz)', 'useful'],
      ['similar(bibcode:2020ApJ)', 'similar'],
      ['TRENDING(collection:astronomy)', 'trending upper-case'],
      ['trending (collection:astronomy)', 'trending with space before paren'],
    ])('%s', (q) => {
      const result = getDefaultSortForQuery(q, PREF_SORT);
      expect(result[0]).toBe('score desc');
    });
  });

  describe('regular queries — returns fallback', () => {
    test.each([
      ['star formation'],
      ['author:kurtz'],
      ['trending_topic:foo'],
      [''],
      ['reviews_count > 5'],
      ['title:trending(foo)'],
      ['"trending("'],
    ])('%s', (q) => {
      expect(getDefaultSortForQuery(q, PREF_SORT)).toBe(PREF_SORT);
    });
  });
});
