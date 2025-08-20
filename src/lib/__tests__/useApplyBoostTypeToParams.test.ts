import { describe, expect, test } from 'vitest';
import { AppMode } from '@/types';
import { useApplyBoostTypeToParams } from '@/lib/useApplyBoostTypeToParams';
import { renderHook } from '@/test-utils';
import { IADSApiSearchParams } from '@/api/search/types';
import { APP_DEFAULTS } from '@/config';

describe('useApplyBoostTypeToParams', () => {
  const cases: Array<
    [string, AppMode, Parameters<typeof useApplyBoostTypeToParams>, ReturnType<typeof useApplyBoostTypeToParams>]
  > = [
    ['GENERAL mode', AppMode.GENERAL, [{ params: { q: 'star' } }], { params: { q: 'star', boostType: 'general' } }],
    [
      'ASTROPHYSICS mode',
      AppMode.ASTROPHYSICS,
      [{ params: { q: 'star' } }],
      { params: { q: 'star', boostType: 'astrophysics' } },
    ],
    [
      'HELIOPHYSICS mode',
      AppMode.HELIOPHYSICS,
      [{ params: { q: 'star' } }],
      { params: { q: 'star', boostType: 'heliophysics' } },
    ],
    [
      'PLANET_SCIENCE mode',
      AppMode.PLANET_SCIENCE,
      [{ params: { q: 'star' } }],
      { params: { q: 'star', boostType: 'planetary' } },
    ],
    [
      'EARTH_SCIENCE mode',
      AppMode.EARTH_SCIENCE,
      [{ params: { q: 'star' } }],
      { params: { q: 'star', boostType: 'earthscience' } },
    ],
    [
      'BIO_PHYSICAL mode',
      AppMode.BIO_PHYSICAL,
      [{ params: { q: 'star' } }],
      { params: { q: 'star', boostType: 'general' } },
    ],
    [
      'Unknown mode',
      'UNKNOWN' as AppMode,
      [{ params: { q: 'star' } }],
      { params: { q: 'star', boostType: 'general' } },
    ],
    [
      'Empty params',
      AppMode.GENERAL,
      [{ params: {} as IADSApiSearchParams }],
      { params: { q: APP_DEFAULTS.EMPTY_QUERY, boostType: 'general' } },
    ],
  ];

  test.concurrent.each(cases)('%s', (_, mode, args, expected) => {
    const { result } = renderHook(() => useApplyBoostTypeToParams(...args), { initialStore: { mode } });
    expect(result.current).toEqual(expected);
  });
});
