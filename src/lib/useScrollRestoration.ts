import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { logger } from '@/logger';
import { ADS_COMPAT_URL_PARAM } from '@/utils/common/search-mode-constants';

const SCROLL_POSITION_KEY = 'search-scroll-position';
const SCROLL_ROW_INDEX_KEY = 'search-scroll-row-index';
const SEARCH_PATHNAME = '/search';
const VOLATILE_SEARCH_PARAMS = ['d', ADS_COMPAT_URL_PARAM];

const isSearchPage = (): boolean => typeof window !== 'undefined' && window.location.pathname === SEARCH_PATHNAME;

const searchIdentity = (): string => {
  const params = new URLSearchParams(window.location.search);
  VOLATILE_SEARCH_PARAMS.forEach((param) => params.delete(param));
  params.sort();
  return params.toString();
};

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
  if (!isSearchPage()) {
    return;
  }
  const rowIndex = topVisibleRowIndex();
  if (rowIndex !== null) {
    sessionStorage.setItem(SCROLL_ROW_INDEX_KEY, JSON.stringify({ index: rowIndex, search: searchIdentity() }));
    sessionStorage.removeItem(SCROLL_POSITION_KEY);
    return;
  }
  const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  sessionStorage.setItem(SCROLL_POSITION_KEY, scrollPosition.toString());
  sessionStorage.removeItem(SCROLL_ROW_INDEX_KEY);
};

export const takeSavedRowIndex = (): number | null => {
  if (!isSearchPage()) {
    return null;
  }
  const raw = sessionStorage.getItem(SCROLL_ROW_INDEX_KEY);
  if (raw === null) {
    return null;
  }
  let saved: { index?: unknown; search?: unknown };
  try {
    saved = JSON.parse(raw) as { index?: unknown; search?: unknown };
  } catch {
    sessionStorage.removeItem(SCROLL_ROW_INDEX_KEY);
    return null;
  }
  if (typeof saved.index !== 'number' || !Number.isFinite(saved.index)) {
    sessionStorage.removeItem(SCROLL_ROW_INDEX_KEY);
    return null;
  }
  if (saved.search !== searchIdentity()) {
    return null;
  }
  sessionStorage.removeItem(SCROLL_ROW_INDEX_KEY);
  return saved.index;
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
};
