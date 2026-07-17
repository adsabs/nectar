import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useSearchMode } from '../useSearchMode';
import { SearchMode } from '@/utils/common/searchMode';

// Mock the store to control searchMode state
const mockSetSearchMode = vi.fn();
let mockSearchMode = '';

vi.mock('@/store', () => ({
  useStore: (selector: (s: { searchMode: string; setSearchMode: typeof mockSetSearchMode }) => unknown) =>
    selector({ searchMode: mockSearchMode, setSearchMode: mockSetSearchMode }),
}));

describe('useSearchMode', () => {
  beforeEach(() => {
    mockSearchMode = '';
    vi.clearAllMocks();
  });

  test('returns current searchMode from store', () => {
    mockSearchMode = SearchMode.ADS_COMPAT;
    const { result } = renderHook(() => useSearchMode());
    expect(result.current[0]).toBe(SearchMode.ADS_COMPAT);
  });

  test('returns empty string as default when no mode is set', () => {
    const { result } = renderHook(() => useSearchMode());
    expect(result.current[0]).toBe('');
  });

  test('calls store setSearchMode when setter is invoked', () => {
    const { result } = renderHook(() => useSearchMode());
    act(() => {
      result.current[1](SearchMode.ADS_COMPAT);
    });
    expect(mockSetSearchMode).toHaveBeenCalledWith(SearchMode.ADS_COMPAT);
  });

  test('returns a stable setter reference', () => {
    const { result, rerender } = renderHook(() => useSearchMode());
    const first = result.current[1];
    rerender();
    expect(result.current[1]).toBe(first);
  });
});
