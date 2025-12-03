import { describe, expect, it } from 'vitest';
import { applyAdsModeDefaultsToQuery, ADS_DEFAULT_COLLECTIONS, ADS_DEFAULT_SORT } from '../adsMode';
import { IADSApiSearchParams } from '@/api/search/types';

describe('applyAdsModeDefaultsToQuery', () => {
  const baseQuery: IADSApiSearchParams = {
    q: '*:*',
    sort: ['score desc'],
  };

  it('returns the original query when ADS mode is disabled', () => {
    const { query, applied } = applyAdsModeDefaultsToQuery({
      query: baseQuery,
      adsModeEnabled: false,
    });

    expect(applied).toBe(false);
    expect(query).toEqual(baseQuery);
  });

  it('applies ADS defaults when enabled', () => {
    const { query, applied } = applyAdsModeDefaultsToQuery({
      query: baseQuery,
      adsModeEnabled: true,
    });

    expect(applied).toBe(true);
    expect(query.sort?.[0]).toBe(ADS_DEFAULT_SORT);
    expect(query.fq_database).toContain(`database:"${ADS_DEFAULT_COLLECTIONS[0]}"`);
    expect(query.fq_database).toContain(`database:"${ADS_DEFAULT_COLLECTIONS[1]}"`);
    expect(query.fq).toContain('{!type=aqp v=$fq_database}');
  });

  it('preserves additional sort values and overwrites primary sort to ADS default', () => {
    const multiSortQuery: IADSApiSearchParams = {
      ...baseQuery,
      sort: ['read_count desc', 'score desc'],
    };

    const { query } = applyAdsModeDefaultsToQuery({
      query: multiSortQuery,
      adsModeEnabled: true,
    });

    expect(query.sort?.[0]).toBe(ADS_DEFAULT_SORT);
    expect(query.sort?.slice(1)).toEqual(['score desc']);
  });

  it('handles fq passed as string by wrapping and deduping', () => {
    const stringFqQuery: IADSApiSearchParams = {
      ...baseQuery,
      fq: '{!type=aqp v=$fq_database}',
      fq_database: 'database:"earthscience"',
    } as unknown as IADSApiSearchParams;

    const { query } = applyAdsModeDefaultsToQuery({
      query: stringFqQuery,
      adsModeEnabled: true,
    });

    expect(Array.isArray(query.fq)).toBe(true);
    expect(query.fq?.filter((fq) => fq === '{!type=aqp v=$fq_database}')).toHaveLength(1);
    expect(query.fq_database).toContain('database:"astronomy"');
    expect(query.fq_database).toContain('database:"physics"');
  });

  it('dedupes fq entries when ADS token is already present', () => {
    const dupFqQuery: IADSApiSearchParams = {
      ...baseQuery,
      fq: ['{!type=aqp v=$fq_database}', '{!type=aqp v=$fq_database}', 'other'],
      fq_database: 'database:"earthscience"',
    };

    const { query } = applyAdsModeDefaultsToQuery({
      query: dupFqQuery,
      adsModeEnabled: true,
    });

    expect(query.fq?.filter((fq) => fq === '{!type=aqp v=$fq_database}')).toHaveLength(1);
    expect(query.fq).toContain('other');
  });

  it('replaces existing database filters', () => {
    const queryWithFq: IADSApiSearchParams = {
      ...baseQuery,
      fq: ['{!type=aqp v=$fq_database}', 'other-filter'],
      fq_database: 'database:"earthscience"',
    };

    const { query } = applyAdsModeDefaultsToQuery({
      query: queryWithFq,
      adsModeEnabled: true,
    });

    expect(query.fq_database).toContain(`database:"${ADS_DEFAULT_COLLECTIONS[0]}"`);
    expect(query.fq_database).toContain(`database:"${ADS_DEFAULT_COLLECTIONS[1]}"`);
    expect(query.fq?.filter((fq) => fq === '{!type=aqp v=$fq_database}')).toHaveLength(1);
    expect(query.fq).toContain('other-filter');
  });
});
