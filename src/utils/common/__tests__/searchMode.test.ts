import { describe, expect, test } from 'vitest';
import { ADS_COMPAT_FQ_DATABASE, ADS_COMPAT_FQ_ENTRY, applySearchModeDefaults, SearchMode } from '../searchMode';
import type { IADSApiSearchParams } from '@/api/search/types';

const BASE: IADSApiSearchParams = { q: 'dark matter', sort: ['score desc'] };

const ADS_QUERY: IADSApiSearchParams = {
  ...BASE,
  fq: [ADS_COMPAT_FQ_ENTRY],
  fq_database: ADS_COMPAT_FQ_DATABASE,
  sort: ['date desc'],
};

describe('applySearchModeDefaults — ADS_COMPAT', () => {
  test('adds astronomy and physics database filter', () => {
    const result = applySearchModeDefaults(BASE, SearchMode.ADS_COMPAT);
    expect(result.fq).toContain(ADS_COMPAT_FQ_ENTRY);
    expect(result.fq_database).toBe(ADS_COMPAT_FQ_DATABASE);
  });

  test('sets date sort', () => {
    const result = applySearchModeDefaults(BASE, SearchMode.ADS_COMPAT);
    expect(result.sort).toEqual(['date desc']);
  });

  test('does not duplicate fq_database entry when already present', () => {
    const result = applySearchModeDefaults(ADS_QUERY, SearchMode.ADS_COMPAT);
    const count = (result.fq as string[]).filter((f) => f === ADS_COMPAT_FQ_ENTRY).length;
    expect(count).toBe(1);
  });

  test('preserves unrelated fq filters', () => {
    const withAuthor: IADSApiSearchParams = {
      ...BASE,
      fq: ['{!type=aqp v=$fq_author}'],
      fq_author: 'author:"Smith"',
    };
    const result = applySearchModeDefaults(withAuthor, SearchMode.ADS_COMPAT);
    expect(result.fq).toContain('{!type=aqp v=$fq_author}');
    expect(result.fq_author).toBe('author:"Smith"');
  });
});

describe('applySearchModeDefaults — ALL_RELEVANT', () => {
  test('returns query unchanged when no ADS filters are present', () => {
    expect(applySearchModeDefaults(BASE, SearchMode.ALL_RELEVANT)).toEqual(BASE);
  });

  test('returns query unchanged when mode is absent', () => {
    expect(applySearchModeDefaults(BASE, undefined)).toEqual(BASE);
  });

  test('returns query unchanged for an unrecognised mode string', () => {
    expect(applySearchModeDefaults(BASE, 'UNKNOWN')).toEqual(BASE);
  });

  test('strips ADS database filter when switching back from ADS_COMPAT', () => {
    const result = applySearchModeDefaults(ADS_QUERY, SearchMode.ALL_RELEVANT);
    expect(result.fq_database).toBeUndefined();
    expect(result.fq).toBeUndefined();
  });

  test('does not strip a user-set database filter that differs from ADS defaults', () => {
    const userQuery: IADSApiSearchParams = {
      ...BASE,
      fq: ['{!type=aqp v=$fq_database}'],
      fq_database: 'database:"earthscience"',
    };
    const result = applySearchModeDefaults(userQuery, SearchMode.ALL_RELEVANT);
    expect(result.fq_database).toBe('database:"earthscience"');
    expect(result.fq).toContain('{!type=aqp v=$fq_database}');
  });

  test('preserves other fq entries when stripping ADS database filter', () => {
    const mixed: IADSApiSearchParams = {
      ...BASE,
      fq: [ADS_COMPAT_FQ_ENTRY, '{!type=aqp v=$fq_author}'],
      fq_database: ADS_COMPAT_FQ_DATABASE,
      fq_author: 'author:"Smith"',
    };
    const result = applySearchModeDefaults(mixed, SearchMode.ALL_RELEVANT);
    expect(result.fq_database).toBeUndefined();
    expect(result.fq).not.toContain(ADS_COMPAT_FQ_ENTRY);
    expect(result.fq).toContain('{!type=aqp v=$fq_author}');
    expect(result.fq_author).toBe('author:"Smith"');
  });
});
