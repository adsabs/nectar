import { renderHook } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useSaveScrollPosition, useScrollRestoration } from './useScrollRestoration';

const SCROLL_POSITION_KEY = 'search-scroll-position';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({ pathname: '/search' })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

const flushFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

describe('useScrollRestoration', () => {
  let scrollTo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mocks.useRouter.mockReturnValue({ pathname: '/search' });
    sessionStorage.clear();
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    scrollTo.mockRestore();
    sessionStorage.clear();
  });

  describe('the page-level hook restores a saved position (criterion 5)', () => {
    test('scrolls to the saved position and clears it', async () => {
      sessionStorage.setItem(SCROLL_POSITION_KEY, '2750');

      renderHook(() => useScrollRestoration());
      await flushFrame();

      expect(scrollTo).toHaveBeenCalledWith({ top: 2750, behavior: 'auto' });
      expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBeNull();
    });

    test('does not scroll when no position was saved', async () => {
      renderHook(() => useScrollRestoration());
      await flushFrame();

      expect(scrollTo).not.toHaveBeenCalled();
    });

    test('does not scroll when the route is not /search', async () => {
      mocks.useRouter.mockReturnValue({ pathname: '/abs/[id]/abstract' });
      sessionStorage.setItem(SCROLL_POSITION_KEY, '2750');

      renderHook(() => useScrollRestoration());
      await flushFrame();

      expect(scrollTo).not.toHaveBeenCalled();
      expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBe('2750');
    });
  });

  describe('the save-only hook never restores (criterion 5)', () => {
    test('leaves a saved position untouched', async () => {
      sessionStorage.setItem(SCROLL_POSITION_KEY, '2750');

      renderHook(() => useSaveScrollPosition());
      await flushFrame();

      expect(scrollTo).not.toHaveBeenCalled();
      expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBe('2750');
    });

    test('still writes the current position when asked', () => {
      Object.defineProperty(window, 'scrollY', { value: 412, configurable: true });

      const { result } = renderHook(() => useSaveScrollPosition());
      result.current.saveScrollPosition();

      expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBe('412');
    });
  });
});
