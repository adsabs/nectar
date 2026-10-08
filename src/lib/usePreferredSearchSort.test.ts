import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { APP_DEFAULTS } from '@/config';
import { writePrefsCookie } from '@/utils/common/prefs-cookie';
import { usePreferredSearchSort } from './usePreferredSearchSort';

const mocks = vi.hoisted(() => ({
  settings: { current: { preferredSearchSort: 'score' } as { preferredSearchSort?: string } },
  isPlaceholderData: { current: true },
}));

vi.mock('@/lib/useSettings', () => ({
  useSettings: () => ({
    settings: mocks.settings.current,
    getSettingsState: { isPlaceholderData: mocks.isPlaceholderData.current },
  }),
}));

beforeEach(() => {
  mocks.settings.current = { preferredSearchSort: 'score' };
  mocks.isPlaceholderData.current = true;
});

afterEach(() => {
  document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
});

describe('usePreferredSearchSort', () => {
  // Until settings resolve, useSettings serves a placeholder sort of the app
  // default; reading that would hash a different query than the server's
  // cookie-seeded one and discard the seed for exactly this user.
  test('reads the cookie while the settings query is unresolved', () => {
    writePrefsCookie({ preferredSearchSort: 'citation_count' });

    const { result } = renderHook(() => usePreferredSearchSort());

    expect(result.current).toBe('citation_count');
  });

  test('prefers resolved settings over the cookie', () => {
    writePrefsCookie({ preferredSearchSort: 'citation_count' });
    mocks.isPlaceholderData.current = false;
    mocks.settings.current = { preferredSearchSort: 'date' };

    const { result } = renderHook(() => usePreferredSearchSort());

    expect(result.current).toBe('date');
  });

  test('falls back to the app default when nothing is recorded', () => {
    const { result } = renderHook(() => usePreferredSearchSort());

    expect(result.current).toBe(APP_DEFAULTS.PREFERRED_SEARCH_SORT);
  });

  test('ignores a cookie value that is not a sort field', () => {
    writePrefsCookie({ preferredSearchSort: 'not-a-field' });

    const { result } = renderHook(() => usePreferredSearchSort());

    expect(result.current).toBe(APP_DEFAULTS.PREFERRED_SEARCH_SORT);
  });

  test('does not fall back to the cookie once settings resolve to the default', () => {
    writePrefsCookie({ preferredSearchSort: 'citation_count' });
    mocks.isPlaceholderData.current = false;
    mocks.settings.current = { preferredSearchSort: APP_DEFAULTS.PREFERRED_SEARCH_SORT };

    const { result } = renderHook(() => usePreferredSearchSort());

    expect(result.current).toBe(APP_DEFAULTS.PREFERRED_SEARCH_SORT);
  });
});
