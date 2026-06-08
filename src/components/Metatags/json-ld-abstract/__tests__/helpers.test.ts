import { describe, expect, test } from 'vitest';
import { asArray } from '../helpers';

describe('asArray', () => {
  test('returns [] for null/undefined', () => {
    expect(asArray(undefined)).toEqual([]);
    expect(asArray(null)).toEqual([]);
  });

  test('returns same array for arrays', () => {
    const arr = [1, 2, 3];
    expect(asArray(arr)).toBe(arr);
  });

  test('wraps scalars in array', () => {
    expect(asArray('x')).toEqual(['x']);
    expect(asArray(5)).toEqual([5]);
    expect(asArray({ a: 1 })).toEqual([{ a: 1 }]);
  });
});
