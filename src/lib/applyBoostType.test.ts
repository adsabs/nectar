import { describe, expect, test } from 'vitest';

import { APP_DEFAULTS } from '@/config';
import { AppMode } from '@/types';
import { IADSApiSearchParams } from '@/api/search/types';
import { applyBoostType } from '@/lib/applyBoostType';

describe('applyBoostType', () => {
  const params: IADSApiSearchParams = { q: 'star' };

  test.each([
    [AppMode.GENERAL, 'general'],
    [AppMode.ASTROPHYSICS, 'astrophysics'],
    [AppMode.HELIOPHYSICS, 'heliophysics'],
    [AppMode.PLANET_SCIENCE, 'planetary'],
    [AppMode.EARTH_SCIENCE, 'earthscience'],
    // BIO_PHYSICAL deliberately shares the 'general' boost bucket.
    [AppMode.BIO_PHYSICAL, 'general'],
  ])('maps %s to boostType %s', (mode, expected) => {
    expect(applyBoostType(params, mode).boostType).toBe(expected);
  });

  test('falls back to general for an unrecognized mode', () => {
    expect(applyBoostType(params, 'UNKNOWN' as AppMode).boostType).toBe('general');
  });

  test('preserves the incoming params alongside boostType', () => {
    const result = applyBoostType({ q: 'star', rows: 25, start: 50 }, AppMode.ASTROPHYSICS);

    expect(result).toEqual({ q: 'star', rows: 25, start: 50, boostType: 'astrophysics' });
  });

  test('replaces params that carry no string q with the empty query', () => {
    const result = applyBoostType({} as IADSApiSearchParams, AppMode.ASTROPHYSICS);

    expect(result).toEqual({ q: APP_DEFAULTS.EMPTY_QUERY, boostType: 'astrophysics' });
  });

  test('discards unrelated params when q is not a string', () => {
    const result = applyBoostType({ q: 42, rows: 25 } as unknown as IADSApiSearchParams, AppMode.GENERAL);

    expect(result).toEqual({ q: APP_DEFAULTS.EMPTY_QUERY, boostType: 'general' });
  });

  test('does not mutate the params it is given', () => {
    const input: IADSApiSearchParams = { q: 'star' };

    applyBoostType(input, AppMode.HELIOPHYSICS);

    expect(input).toEqual({ q: 'star' });
  });
});
