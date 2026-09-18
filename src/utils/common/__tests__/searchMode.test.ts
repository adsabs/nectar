import { describe, expect, test } from 'vitest';
import {
  ADS_COMPAT_FQ_DATABASE,
  ADS_COMPAT_FQ_ENTRY,
  ADS_COMPAT_URL_PARAM,
  applySearchModeDefaults,
  buildSortChangeOutgoing,
  SearchMode,
} from '../searchMode';
import type { IADSApiSearchParams } from '@/api/search/types';

const BASE: IADSApiSearchParams = { q: 'dark matter', sort: ['score desc'] };

const ADS_QUERY: IADSApiSearchParams = {
  ...BASE,
  fq: [ADS_COMPAT_FQ_ENTRY],
  fq_database: ADS_COMPAT_FQ_DATABASE,
  sort: ['date desc'],
  [ADS_COMPAT_URL_PARAM]: '1',
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

  test('does not re-add a collection the user removed from fq_database', () => {
    const partial: IADSApiSearchParams = {
      ...BASE,
      fq: [ADS_COMPAT_FQ_ENTRY],
      fq_database: 'database:"physics"',
      [ADS_COMPAT_URL_PARAM]: '1',
    };
    const result = applySearchModeDefaults(partial, SearchMode.ADS_COMPAT);
    expect(result.fq_database).toBe('database:"physics"');
  });

  test('adds the fq entry for an existing fq_database that lacks one', () => {
    const missingEntry: IADSApiSearchParams = {
      ...BASE,
      fq_database: 'database:"physics"',
      [ADS_COMPAT_URL_PARAM]: '1',
    };
    const result = applySearchModeDefaults(missingEntry, SearchMode.ADS_COMPAT);
    expect(result.fq).toContain(ADS_COMPAT_FQ_ENTRY);
    expect(result.fq_database).toBe('database:"physics"');
  });

  test('keeps fq intact when it arrived as a single string alongside an existing fq_database', () => {
    const singleFq = {
      ...BASE,
      fq: ADS_COMPAT_FQ_ENTRY,
      fq_database: 'database:"physics"',
      [ADS_COMPAT_URL_PARAM]: '1',
    } as unknown as IADSApiSearchParams;
    const result = applySearchModeDefaults(singleFq, SearchMode.ADS_COMPAT);
    expect(result.fq).toEqual([ADS_COMPAT_FQ_ENTRY]);
    expect(result.fq_database).toBe('database:"physics"');
  });

  test('replaces a settings-derived database filter when entering compat mode', () => {
    const fromPrefs: IADSApiSearchParams = {
      ...BASE,
      fq: [ADS_COMPAT_FQ_ENTRY],
      fq_database: '(database:"Earth Science")',
    };
    const result = applySearchModeDefaults(fromPrefs, SearchMode.ADS_COMPAT);
    expect(result.fq_database).toBe(ADS_COMPAT_FQ_DATABASE);
    expect(result.fq).toContain(ADS_COMPAT_FQ_ENTRY);
  });

  test('treats an empty fq_database as cleared rather than installing an empty fq', () => {
    const emptyValue = {
      ...BASE,
      fq_database: '',
      [ADS_COMPAT_URL_PARAM]: '1',
    } as unknown as IADSApiSearchParams;
    const result = applySearchModeDefaults(emptyValue, SearchMode.ADS_COMPAT);
    expect(result.fq ?? []).not.toContain(ADS_COMPAT_FQ_ENTRY);
  });

  test('respects a cleared collection filter inside compat mode', () => {
    const cleared: IADSApiSearchParams = { ...BASE, [ADS_COMPAT_URL_PARAM]: '1' };
    const result = applySearchModeDefaults(cleared, SearchMode.ADS_COMPAT);
    expect(result.fq_database).toBeUndefined();
    expect(result.fq ?? []).not.toContain(ADS_COMPAT_FQ_ENTRY);
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
  test('keeps a user-set collection filter when the query never carried ads_compat', () => {
    const userPicked: IADSApiSearchParams = {
      ...BASE,
      fq: [ADS_COMPAT_FQ_ENTRY],
      fq_database: 'database:"astronomy"',
    };
    const result = applySearchModeDefaults(userPicked, SearchMode.ALL_RELEVANT);
    expect(result.fq_database).toBe('database:"astronomy"');
    expect(result.fq).toContain(ADS_COMPAT_FQ_ENTRY);
  });

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

  test('strips a partially-removed compat database filter', () => {
    const partial: IADSApiSearchParams = {
      ...BASE,
      fq: [ADS_COMPAT_FQ_ENTRY],
      fq_database: 'database:"physics"',
      sort: ['date desc'],
      [ADS_COMPAT_URL_PARAM]: '1',
    };
    const result = applySearchModeDefaults(partial, SearchMode.ALL_RELEVANT);
    expect(result.fq_database).toBeUndefined();
    expect(result.fq).toBeUndefined();
  });

  test('strips compat filters when fq arrived as a single string, not an array', () => {
    const singleFq = {
      ...BASE,
      fq: ADS_COMPAT_FQ_ENTRY,
      fq_database: ADS_COMPAT_FQ_DATABASE,
      [ADS_COMPAT_URL_PARAM]: '1',
    } as unknown as IADSApiSearchParams;
    const result = applySearchModeDefaults(singleFq, SearchMode.ALL_RELEVANT);
    expect(result.fq_database).toBeUndefined();
    expect(result.fq).toBeUndefined();
  });

  test('drops the ads_compat marker once compat filters are stripped', () => {
    const result = applySearchModeDefaults(ADS_QUERY, SearchMode.ALL_RELEVANT);
    expect(result).not.toHaveProperty(ADS_COMPAT_URL_PARAM);
  });

  test('strips a ClassicForm-shaped compat filter with unquoted terms', () => {
    const classicForm: IADSApiSearchParams = {
      ...BASE,
      fq: [ADS_COMPAT_FQ_ENTRY],
      fq_database: 'database: (astronomy OR physics)',
      [ADS_COMPAT_URL_PARAM]: '1',
    };
    const result = applySearchModeDefaults(classicForm, SearchMode.ALL_RELEVANT);
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
      [ADS_COMPAT_URL_PARAM]: '1',
    };
    const result = applySearchModeDefaults(mixed, SearchMode.ALL_RELEVANT);
    expect(result.fq_database).toBeUndefined();
    expect(result.fq).not.toContain(ADS_COMPAT_FQ_ENTRY);
    expect(result.fq).toContain('{!type=aqp v=$fq_author}');
    expect(result.fq_author).toBe('author:"Smith"');
  });
});

describe('buildSortChangeOutgoing', () => {
  test('keeps the explicit sort in ADS_COMPAT mode instead of forcing date desc', () => {
    const result = buildSortChangeOutgoing(BASE, SearchMode.ADS_COMPAT, ['citation_count desc']);
    expect(result.sort).toEqual(['citation_count desc']);
    expect(result.fq_database).toBe(ADS_COMPAT_FQ_DATABASE);
    expect(result).toHaveProperty('ads_compat', '1');
  });

  test('strips ADS filters and keeps the explicit sort in ALL_RELEVANT mode', () => {
    const result = buildSortChangeOutgoing(ADS_QUERY, SearchMode.ALL_RELEVANT, ['citation_count desc']);
    expect(result.fq_database).toBeUndefined();
    expect(result.fq).toBeUndefined();
    expect(result.sort).toEqual(['citation_count desc']);
    expect(result).not.toHaveProperty('ads_compat');
  });
});
