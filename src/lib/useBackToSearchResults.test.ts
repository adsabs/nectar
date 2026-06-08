import { renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useBackToSearchResults } from './useBackToSearchResults';

const router = {
  back: vi.fn(),
};
vi.mock('next/router', () => ({
  useRouter: () => router,
}));

describe('useBackToSearchResults', () => {
  test('handleBack calls router.back()', () => {
    const { result } = renderHook(() => useBackToSearchResults());
    result.current.handleBack();
    expect(router.back).toHaveBeenCalledOnce();
  });
});
