import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { logger } from '@/logger';

const SCROLL_POSITION_KEY = 'search-scroll-position';
const SCROLL_ROW_INDEX_KEY = 'search-scroll-row-index';

const topVisibleRowIndex = (): number | null => {
  const rows = Array.from(document.querySelectorAll<HTMLElement>('#results [data-index]'));
  let best: { index: number; top: number } | null = null;
  for (const row of rows) {
    const index = Number(row.getAttribute('data-index'));
    if (!Number.isFinite(index)) {
      continue;
    }
    const top = row.getBoundingClientRect().top;
    if (top >= -row.offsetHeight / 2 && (best === null || top < best.top)) {
      best = { index, top };
    }
  }
  return best?.index ?? null;
};

export const saveScrollPosition = (): void => {
  if (typeof window === 'undefined' || window.location.pathname !== '/search') {
    return;
  }
  const rowIndex = topVisibleRowIndex();
  if (rowIndex !== null) {
    sessionStorage.setItem(SCROLL_ROW_INDEX_KEY, rowIndex.toString());
    sessionStorage.removeItem(SCROLL_POSITION_KEY);
    return;
  }
  const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPosition.toString());
  sessionStorage.removeItem(SCROLL_ROW_INDEX_KEY);
};

export const takeSavedRowIndex = (): number | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = sessionStorage.getItem(SCROLL_ROW_INDEX_KEY);
  if (raw === null) {
    return null;
  }
  sessionStorage.removeItem(SCROLL_ROW_INDEX_KEY);
  const index = parseInt(raw, 10);
  return Number.isFinite(index) ? index : null;
};

export const clearScrollPosition = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SCROLL_POSITION_KEY);
    sessionStorage.removeItem(SCROLL_ROW_INDEX_KEY);
  }
};

/**
 * Hook to manage scroll position restoration when navigating between search results and abstract pages
 */
export const useScrollRestoration = () => {
  const router = useRouter();
  const shouldRestoreRef = useRef(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Check if we should restore scroll position on mount
    const savedPosition = sessionStorage.getItem(SCROLL_POSITION_KEY);
    logger.debug({ savedPosition }, 'useScrollRestoration');
    if (savedPosition && router.pathname === '/search') {
      shouldRestoreRef.current = true;

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        const position = parseInt(savedPosition, 10);
        if (!isNaN(position)) {
          window.scrollTo({
            top: position,
            // Use 'auto' for instant scroll, 'smooth' for animated
            behavior: 'auto',
          });
        }
        // Clear the stored position after restoration
        sessionStorage.removeItem(SCROLL_POSITION_KEY);
        shouldRestoreRef.current = false;
      });
    }
  }, [router.pathname]);

  return {
    saveScrollPosition,
    clearScrollPosition,
  };
};
