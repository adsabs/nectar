import { describe, expect, test } from 'vitest';
import { canonicalSearchParams, getDefaultSortForQuery, toFacetSearchParams } from '@/utils/common/search';
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

describe('canonicalSearchParams', () => {
  describe('q', () => {
    test('empty or missing q becomes the match-all query', () => {
      expect(canonicalSearchParams({}).q).toBe('*:*');
      expect(canonicalSearchParams({ q: '' }).q).toBe('*:*');
    });

    test('q passes through', () => {
      expect(canonicalSearchParams({ q: 'star formation' }).q).toBe('star formation');
    });
  });

  describe('sort resolution', () => {
    test('URL sort wins over the preferred-sort setting', () => {
      const { sort } = canonicalSearchParams({ sort: ['citation_count desc'] }, { preferredSortField: 'date' });
      expect(sort).toEqual(['citation_count desc', 'date desc']);
    });

    test('absent sort resolves to the preferred-sort setting with its default direction', () => {
      const { sort } = canonicalSearchParams({}, { preferredSortField: 'first_author' });
      expect(sort).toEqual(['first_author asc', 'date desc']);
    });

    test('absent sort and no setting falls back to APP_DEFAULTS preferred sort', () => {
      const { sort } = canonicalSearchParams({});
      expect(sort).toEqual(['score desc', 'date desc']);
    });

    test('single string sort is normalized', () => {
      const { sort } = canonicalSearchParams({ sort: 'date asc' });
      expect(sort).toEqual(['date asc', 'date desc']);
    });

    test('invalid sort values fall back to the normalize default', () => {
      const { sort } = canonicalSearchParams({ sort: ['bogus nonsense'] });
      expect(sort).toEqual(['score desc', 'date desc']);
    });
  });

  describe('p and rows', () => {
    test('p is clamped to >= 1 and parsed from strings', () => {
      expect(canonicalSearchParams({ p: '3' }).p).toBe(3);
      expect(canonicalSearchParams({ p: '0' }).p).toBe(1);
      expect(canonicalSearchParams({ p: 'junk' }).p).toBe(1);
      expect(canonicalSearchParams({}).p).toBe(1);
    });

    test('valid URL rows wins over the preference', () => {
      expect(canonicalSearchParams({ rows: '25' }, { numPerPage: 50 }).rows).toBe(25);
      expect(canonicalSearchParams({ rows: 25 }, { numPerPage: 50 }).rows).toBe(25);
    });

    test('invalid or missing rows falls back to the persisted preference', () => {
      expect(canonicalSearchParams({ rows: '13' }, { numPerPage: 50 }).rows).toBe(50);
      expect(canonicalSearchParams({}, { numPerPage: 50 }).rows).toBe(50);
    });

    test('no rows and no preference falls back to the app default', () => {
      expect(canonicalSearchParams({}).rows).toBe(10);
    });
  });

  describe('fq and passthrough', () => {
    test('fq array passes through intact, including comma-containing values', () => {
      const fq = ['{!type=aqp v=$fq_author}', 'year:2020'];
      expect(canonicalSearchParams({ fq }).fq).toEqual(fq);
    });

    test('fq is omitted when absent', () => {
      expect(canonicalSearchParams({})).not.toHaveProperty('fq');
    });

    test('facet companion params pass through as strings', () => {
      const params = canonicalSearchParams({
        fq_author: '(author_facet_hier:"0/Smith, J")',
        d: 'general',
      });
      expect(params).toMatchObject({
        fq_author: '(author_facet_hier:"0/Smith, J")',
        d: 'general',
      });
    });

    test('fl, start, id, boostType, and showHighlights are never taken from the URL', () => {
      const params = canonicalSearchParams({
        fl: 'title',
        start: '40',
        id: 'x',
        boostType: 'astrophysics',
        showHighlights: 'true',
      });
      expect(params).not.toHaveProperty('fl');
      expect(params).not.toHaveProperty('start');
      expect(params).not.toHaveProperty('id');
      expect(params).not.toHaveProperty('boostType');
      expect(params).not.toHaveProperty('showHighlights');
    });
  });
});

describe('toFacetSearchParams', () => {
  test('strips pagination and field-list keys, keeps query identity', () => {
    const canonical = canonicalSearchParams({ q: 'star', fq: ['year:2020'], p: '3', rows: '25' });
    const facetParams = toFacetSearchParams(canonical);
    expect(facetParams).not.toHaveProperty('p');
    expect(facetParams).not.toHaveProperty('rows');
    expect(facetParams).not.toHaveProperty('start');
    expect(facetParams).not.toHaveProperty('fl');
    expect(facetParams).toMatchObject({ q: 'star', fq: ['year:2020'] });
  });

  test('is stable across page changes', () => {
    const page1 = toFacetSearchParams(canonicalSearchParams({ q: 'star', p: '1' }));
    const page5 = toFacetSearchParams(canonicalSearchParams({ q: 'star', p: '5' }));
    expect(page1).toEqual(page5);
  });
});
