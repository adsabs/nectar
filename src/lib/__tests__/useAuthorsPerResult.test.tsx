import { renderHook } from '@testing-library/react';
import { Mock, afterEach, describe, expect, test, vi } from 'vitest';
import { APP_DEFAULTS } from '@/config';
import { useAuthorsPerResult } from '@/lib/useAuthorsPerResult';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';

vi.mock('@/lib/useSession', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/lib/useSettings', () => ({
  useSettings: vi.fn(),
}));

const mockedUseSession = useSession as unknown as Mock;
const mockedUseSettings = useSettings as unknown as Mock;

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAuthorsPerResult', () => {
  test('returns default for non-authenticated users', () => {
    mockedUseSession.mockReturnValue({ isAuthenticated: false });
    mockedUseSettings.mockReturnValue({
      settings: { minAuthorsPerResult: '10' },
    });

    const { result } = renderHook(() => useAuthorsPerResult());

    expect(result.current).toBe(APP_DEFAULTS.DEFAULT_AUTHORS_PER_RESULT);
  });

  test('returns user preference for authenticated users', () => {
    mockedUseSession.mockReturnValue({ isAuthenticated: true });
    mockedUseSettings.mockReturnValue({
      settings: { minAuthorsPerResult: '7' },
    });

    const { result } = renderHook(() => useAuthorsPerResult());

    expect(result.current).toBe(7);
  });

  test.each(['all', 'ALL', 'All'])('returns DETAILS_MAX_AUTHORS when preference is "%s"', (preference) => {
    mockedUseSession.mockReturnValue({ isAuthenticated: true });
    mockedUseSettings.mockReturnValue({
      settings: { minAuthorsPerResult: preference },
    });

    const { result } = renderHook(() => useAuthorsPerResult());

    expect(result.current).toBe(APP_DEFAULTS.DETAILS_MAX_AUTHORS);
  });

  test('returns default for invalid preference value', () => {
    mockedUseSession.mockReturnValue({ isAuthenticated: true });
    mockedUseSettings.mockReturnValue({
      settings: { minAuthorsPerResult: 'invalid' },
    });

    const { result } = renderHook(() => useAuthorsPerResult());

    expect(result.current).toBe(APP_DEFAULTS.DEFAULT_AUTHORS_PER_RESULT);
  });

  test('passes correct options to useSettings when authenticated', () => {
    mockedUseSession.mockReturnValue({ isAuthenticated: true });
    mockedUseSettings.mockReturnValue({
      settings: { minAuthorsPerResult: '5' },
    });

    renderHook(() => useAuthorsPerResult());

    expect(mockedUseSettings).toHaveBeenCalledWith({ enabled: true }, true);
  });

  test('disables settings fetch for non-authenticated users', () => {
    mockedUseSession.mockReturnValue({ isAuthenticated: false });
    mockedUseSettings.mockReturnValue({
      settings: { minAuthorsPerResult: '5' },
    });

    renderHook(() => useAuthorsPerResult());

    expect(mockedUseSettings).toHaveBeenCalledWith({ enabled: false }, true);
  });
});
