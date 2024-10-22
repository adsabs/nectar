import { IADSApiSearchParams } from '@/api/search/types';
import * as query from '@/query-utils';
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
