import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBackToSearchResults } from './useBackToSearchResults';

const router = {
  back: vi.fn(),
};
vi.mock('next/router', () => ({
  useRouter: () => router,
}));

describe('useBackToSearchResults', () => {
  it('handleBack calls router.back()', () => {
    const { result } = renderHook(() => useBackToSearchResults());
    result.current.handleBack();
    expect(router.back).toHaveBeenCalledOnce();
  });
});
