import { describe, expect, test } from 'vitest';
import { withAbstractField } from '@/api/search/models';
import { IADSApiSearchParams } from '@/api/search/types';

describe('withAbstractField', () => {
  const base: IADSApiSearchParams = { q: 'star', fl: ['bibcode', 'title'] };

  test('appends abstract to fl when showAbstracts is on', () => {
    const result = withAbstractField(base, true);
    expect(result.fl).toContain('abstract');
    expect(result.fl).toEqual(['bibcode', 'title', 'abstract']);
  });

  test('leaves fl untouched when showAbstracts is off', () => {
    const result = withAbstractField(base, false);
    expect(result.fl).toEqual(['bibcode', 'title']);
  });

  test('does not duplicate abstract if already requested', () => {
    const result = withAbstractField({ q: 'star', fl: ['bibcode', 'abstract'] }, true);
    expect(result.fl?.filter((f) => f === 'abstract')).toHaveLength(1);
  });

  test('does not mutate the input params or its fl array', () => {
    const input: IADSApiSearchParams = { q: 'star', fl: ['bibcode'] };
    const inputFl = input.fl;
    withAbstractField(input, true);
    expect(input.fl).toBe(inputFl);
    expect(input.fl).toEqual(['bibcode']);
  });
});
