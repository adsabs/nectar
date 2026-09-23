import { IADSApiSearchParams } from '@/api/search/types';
import * as query from '@/query-utils';
import { getFilters } from '@/components/SearchFacet/helpers';
import { defaultQueryParams } from '@/store/slices';
import { describe, expect, test } from 'vitest';

const testQuery: IADSApiSearchParams = {
  ...defaultQueryParams,
  q: 'star',
  fq_foo: '(A)',
  fq_bar: '(B)',
  fq_baz: '(C)',
  fq: ['{!type=aqp v=$fq_foo}', '{!type=aqp v=$fq_bar}', '{!type=aqp v=$fq_baz}'],
};

const testQueryWithoutFQs: IADSApiSearchParams = {
  ...defaultQueryParams,
  q: 'star',
};

test('createQuery() helper works as expected', () => {
  expect(query.createQuery({})).toEqual(defaultQueryParams);
});

test('clearFQs() clears the query of FQs', () => {
  expect(query.clearFQs(testQuery)).toEqual(testQueryWithoutFQs);
});

describe('getFQs()', () => {
  test('returns array of tuples', () => {
    expect(query.getFQs(testQuery)).toEqual([
      ['foo', '(A)'],
      ['bar', '(B)'],
      ['baz', '(C)'],
    ]);
  });

  test('if no FQ, return an empty array', () => {
    expect(query.getFQs(testQueryWithoutFQs)).toEqual([]);
  });
});

describe('getFQValue()', () => {
  test('returns a proper value', () => {
    expect(query.getFQValue('foo', { q: '', fq_foo: '(A)' })).toEqual('(A)');
  });
  test('if FQ is empty, return an empty string', () => {
    expect(query.getFQValue('foo', { q: '' })).toEqual('');
  });
});

describe('setFQs()', () => {
  test('creates a new FQ if none exists', () => {
    expect(query.setFQ('foo', 'A', { q: '' })).toEqual({
      q: '',
      fq_foo: '(A)',
      fq: ['{!type=aqp v=$fq_foo}'],
    });
  });
  test('adds to an FQ if it already has values', () => {
    expect(
      query.setFQ('foo', 'B', {
        q: '',
        fq_foo: '(A)',
        fq: ['{!type=aqp v=$fq_foo}'],
      }),
    ).toEqual({
      q: '',
      fq_foo: '(A) AND (B)',
      fq: ['{!type=aqp v=$fq_foo}'],
    });
  });
});

describe('removeFQClause()', () => {
  test('properly removes a clause', () => {
    expect(
      query.removeFQClause('foo', '(B)', {
        q: '',
        fq_foo: '(A) AND (B) AND (C) AND (D)',
        fq: ['{!type=aqp v=$fq_foo}'],
      }),
    ).toEqual({
      q: '',
      fq_foo: '(A) AND (C) AND (D)',
      fq: ['{!type=aqp v=$fq_foo}'],
    });
  });

  test("removes the param from the query when it's empty", () => {
    expect(
      query.removeFQClause('foo', '(A)', {
        q: '',
        fq_foo: '(A)',
        fq: ['{!type=aqp v=$fq_foo}'],
      }),
    ).toEqual({
      q: '',
    });
  });
});

describe('parseQuery()', () => {
  test('works', () => {
    expect(query.parseQuery({})).toEqual({});
  });
});

describe('removeFQ', () => {
  test('works', () => {
    const q = query.setFQ('foo', 'A', { q: '' });
    expect(q).toEqual({
      q: '',
      fq: ['{!type=aqp v=$fq_foo}'],
      fq_foo: '(A)',
    });
    expect(query.removeFQ('foo', q)).toEqual({ q: '' });
  });
});

describe('removeFQTerm()', () => {
  const dbQuery = (value: string): IADSApiSearchParams => ({
    ...defaultQueryParams,
    q: 'star',
    fq: ['{!type=aqp v=$fq_database}'],
    fq_database: value,
  });

  test('removes a single term and keeps the surviving terms OR-joined', () => {
    const result = query.removeFQTerm(
      'database',
      'database:"physics"',
      dbQuery('(database:"astronomy" OR database:"physics" OR database:"earthscience")'),
    );
    expect(query.getFQValue('database', result)).toBe('(database:"astronomy" OR database:"earthscience")');
  });

  test('drops the fq key and its header when the last term is removed', () => {
    const result = query.removeFQTerm('database', 'database:"astronomy"', dbQuery('(database:"astronomy")'));
    expect(result).not.toHaveProperty('fq_database');
    expect(result).not.toHaveProperty('fq');
  });

  test('leaves other fq keys untouched', () => {
    const withAuthor: IADSApiSearchParams = {
      ...dbQuery('(database:"astronomy" OR database:"physics")'),
      fq: ['{!type=aqp v=$fq_database}', '{!type=aqp v=$fq_author}'],
      fq_author: '(author:"Smith")',
    };
    const result = query.removeFQTerm('database', 'database:"astronomy"', withAuthor);
    expect(query.getFQValue('author', result)).toBe('(author:"Smith")');
    expect(result.fq).toContain('{!type=aqp v=$fq_author}');
  });

  test('wraps a surviving OR group in parens when AND-joined with another group', () => {
    const multiGroup = dbQuery(
      '(database:"astronomy" OR database:"physics" OR database:"general") AND (database:"refereed")',
    );
    const result = query.removeFQTerm('database', 'database:"general"', multiGroup);
    expect(query.getFQValue('database', result)).toBe(
      '(database:"astronomy" OR database:"physics") AND (database:"refereed")',
    );
  });
});

describe('fq arriving as a single string', () => {
  const singleStringFq = {
    ...defaultQueryParams,
    q: 'star',
    fq: '{!type=aqp v=$fq_database}',
    fq_database: '(database:"astronomy")',
  } as unknown as IADSApiSearchParams;

  test('removeFQTerm drops fq entirely when the last term goes', () => {
    const result = query.removeFQTerm('database', 'database:"astronomy"', singleStringFq);
    expect(result).not.toHaveProperty('fq_database');
    expect(result).not.toHaveProperty('fq');
  });

  test('removeFQ drops fq entirely rather than shredding it into characters', () => {
    const result = query.removeFQ('database', singleStringFq);
    expect(result).not.toHaveProperty('fq_database');
    expect(result).not.toHaveProperty('fq');
  });
});

// removeFQTerm's output is fed straight back into the pill pipeline on the next
// render, so the value it writes has to survive getFilters' parser.
describe('removeFQTerm output round-trips through getFilters', () => {
  const pillLabels = (fqDatabase: string) =>
    getFilters({ fq_database: fqDatabase } as IADSApiSearchParams, { isAdsCompat: true })[0][1];

  test('surviving collections still render as pills after a removal', () => {
    const threeCollections = {
      ...defaultQueryParams,
      q: 'star',
      fq: ['{!type=aqp v=$fq_database}'],
      fq_database: '(database:"astronomy" OR database:"physics" OR database:"earthscience")',
    } as IADSApiSearchParams;

    const result = query.removeFQTerm('database', 'database:"earthscience"', threeCollections);

    expect(pillLabels(query.getFQValue('database', result))).toEqual(['astronomy', 'physics']);
  });

  test('surviving groups still render as pills when one group empties', () => {
    const twoGroups = {
      ...defaultQueryParams,
      q: 'star',
      fq: ['{!type=aqp v=$fq_database}'],
      fq_database: '(database:"astronomy" OR database:"physics") AND (database:"general")',
    } as IADSApiSearchParams;

    const result = query.removeFQTerm('database', 'database:"astronomy"', twoGroups);

    expect(pillLabels(query.getFQValue('database', result))).toEqual(['physics', 'general']);
  });
});
