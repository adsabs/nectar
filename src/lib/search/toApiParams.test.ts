import { describe, it, expect } from 'vitest';
import { toApiParams } from './toApiParams';
import { APP_DEFAULTS } from '@/config';
import { SolrSort } from '@/api/models';

const defaultParams = {
  q: 'black holes',
  sort: APP_DEFAULTS.SORT as SolrSort[],
  p: 2,
  rows: 10,
  fq: [] as string[],
  d: '',
  showHighlights: false,
};

describe('toApiParams', () => {
  it('projects only Solr-valid fields and drops nuqs-only fields', () => {
    const result = toApiParams(defaultParams, 10);
    expect(result.q).toBe('black holes');
    expect(result.sort).toEqual(APP_DEFAULTS.SORT);
    expect(result.rows).toBe(10);
    expect(result.start).toBe(10);
    expect(result.fq).toEqual([]);
    // nuqs-only fields must not appear
    expect(result).not.toHaveProperty('p');
    expect(result).not.toHaveProperty('d');
    expect(result).not.toHaveProperty('showHighlights');
  });

  it('spreads extraSolrParams into the result', () => {
    const extra = { fq_range: '(year:2005-2005)' };
    const result = toApiParams(defaultParams, 0, extra);
    expect(result.fq_range).toBe('(year:2005-2005)');
  });

  it('strips unbound local-params fq entries via filterBoundFq', () => {
    const params = { ...defaultParams, fq: ['{!type=aqp v=$fq_range}', 'author:smith'] };
    // No extraSolrParams — fq_range binding absent, entry should be stripped
    const result = toApiParams(params, 0, null);
    expect(result.fq).toEqual(['author:smith']);
  });

  it('keeps local-params fq entries when binding is present in extraSolrParams', () => {
    const params = { ...defaultParams, fq: ['{!type=aqp v=$fq_range}', 'author:smith'] };
    const extra = { fq_range: '(year:2005-2005)' };
    const result = toApiParams(params, 0, extra);
    expect(result.fq).toEqual(['{!type=aqp v=$fq_range}', 'author:smith']);
  });

  it('computes start offset from the provided start argument, not from p', () => {
    // p=3, rows=25 → caller computes start = (3-1)*25 = 50
    const result = toApiParams({ ...defaultParams, p: 3, rows: 25 }, 50);
    expect(result.start).toBe(50);
  });
});
