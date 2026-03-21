import { describe, it, expect } from 'vitest';
import { filterBoundFq } from './filterBoundFq';

describe('filterBoundFq', () => {
  it('keeps regular fq entries unchanged', () => {
    const fq = ['author:smith', 'year:[2000 TO 2020]'];
    expect(filterBoundFq(fq, null)).toEqual(fq);
    expect(filterBoundFq(fq, {})).toEqual(fq);
    expect(filterBoundFq(fq, { fq_range: '(year:2005-2005)' })).toEqual(fq);
  });

  it('strips a local-params fq entry when the bound variable is absent from extraSolrParams', () => {
    const fq = ['{!type=aqp v=$fq_range}', 'author:smith'];
    expect(filterBoundFq(fq, null)).toEqual(['author:smith']);
    expect(filterBoundFq(fq, {})).toEqual(['author:smith']);
    expect(filterBoundFq(fq, { fq_author: 'jones' })).toEqual(['author:smith']);
  });

  it('keeps a local-params fq entry when the bound variable is present in extraSolrParams', () => {
    const fq = ['{!type=aqp v=$fq_range}', 'author:smith'];
    const extra = { fq_range: '(year:2005-2005)' };
    expect(filterBoundFq(fq, extra)).toEqual(fq);
  });

  it('handles multiple local-params entries independently', () => {
    const fq = ['{!type=aqp v=$fq_range}', '{!type=aqp v=$fq_author_facet_hier}', 'author:smith'];
    // Only fq_range present — fq_author_facet_hier should be stripped
    const extra = { fq_range: '(year:2005-2005)' };
    expect(filterBoundFq(fq, extra)).toEqual(['{!type=aqp v=$fq_range}', 'author:smith']);
  });

  it('returns empty array when all entries are stripped', () => {
    const fq = ['{!type=aqp v=$fq_range}'];
    expect(filterBoundFq(fq, null)).toEqual([]);
  });

  it('returns empty array unchanged when input is empty', () => {
    expect(filterBoundFq([], null)).toEqual([]);
    expect(filterBoundFq([], { fq_range: 'x' })).toEqual([]);
  });
});
