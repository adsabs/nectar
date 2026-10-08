import { describe, expect, test } from 'vitest';

import { AppMode } from '@/types';
import { resolveAppMode } from './resolveAppMode';

// The layout's dehydrated store state and the search route's query identity
// both resolve mode through this, so they can't silently disagree.
describe('resolveAppMode precedence', () => {
  test('forceMode beats everything', () => {
    expect(
      resolveAppMode({
        forceModeParam: 'astrophysics',
        dParam: 'heliophysics',
        allowDisciplineParam: true,
        cookieMode: AppMode.EARTH_SCIENCE,
      }),
    ).toBe(AppMode.ASTROPHYSICS);
  });

  test('the discipline param beats the cookie', () => {
    expect(
      resolveAppMode({
        dParam: 'heliophysics',
        allowDisciplineParam: true,
        cookieMode: AppMode.EARTH_SCIENCE,
      }),
    ).toBe(AppMode.HELIOPHYSICS);
  });

  test('the cookie is used when the url says nothing', () => {
    expect(resolveAppMode({ allowDisciplineParam: true, cookieMode: AppMode.EARTH_SCIENCE })).toBe(
      AppMode.EARTH_SCIENCE,
    );
  });

  test('resolves to undefined when nothing is available', () => {
    expect(resolveAppMode({ allowDisciplineParam: true })).toBeUndefined();
  });
});

describe('resolveAppMode discipline-param gating', () => {
  // resolveAppState only honours `d` on a search pathname; the search route
  // always does. Expressing that as a flag is what keeps one implementation.
  test('ignores the discipline param when it is not allowed', () => {
    expect(
      resolveAppMode({
        dParam: 'heliophysics',
        allowDisciplineParam: false,
        cookieMode: AppMode.EARTH_SCIENCE,
      }),
    ).toBe(AppMode.EARTH_SCIENCE);
  });

  test('still honours forceMode when the discipline param is not allowed', () => {
    expect(
      resolveAppMode({
        forceModeParam: 'astrophysics',
        dParam: 'heliophysics',
        allowDisciplineParam: false,
      }),
    ).toBe(AppMode.ASTROPHYSICS);
  });

  test('falls through to undefined when only a disallowed discipline param exists', () => {
    expect(resolveAppMode({ dParam: 'heliophysics', allowDisciplineParam: false })).toBeUndefined();
  });
});

describe('resolveAppMode input handling', () => {
  test('ignores an unrecognised discipline', () => {
    expect(resolveAppMode({ dParam: 'phrenology', allowDisciplineParam: true, cookieMode: AppMode.GENERAL })).toBe(
      AppMode.GENERAL,
    );
  });

  test('ignores an unrecognised forceMode rather than blocking the fallback', () => {
    expect(
      resolveAppMode({
        forceModeParam: 'phrenology',
        dParam: 'heliophysics',
        allowDisciplineParam: true,
      }),
    ).toBe(AppMode.HELIOPHYSICS);
  });

  test('accepts a repeated param by taking the first value', () => {
    expect(resolveAppMode({ dParam: ['planetary', 'earth'], allowDisciplineParam: true })).toBe(AppMode.PLANET_SCIENCE);
  });

  test('tolerates casing and surrounding whitespace', () => {
    expect(resolveAppMode({ dParam: '  Astrophysics ', allowDisciplineParam: true })).toBe(AppMode.ASTROPHYSICS);
  });

  test('treats an empty discipline param as absent', () => {
    expect(resolveAppMode({ dParam: '', allowDisciplineParam: true, cookieMode: AppMode.GENERAL })).toBe(
      AppMode.GENERAL,
    );
  });
});
