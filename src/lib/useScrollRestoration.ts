import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { logger } from '@/logger';
import { safeSessionStorageGet, safeSessionStorageRemove, safeSessionStorageSet } from '@/lib/browserStorage';

const SCROLL_POSITION_KEY = 'search-scroll-position';

/**
 * Hook to manage scroll position restoration when navigating between search results and abstract pages
 */
export const useScrollRestoration = () => {
  const router = useRouter();
  const shouldRestoreRef = useRef(false);

  useEffect(() => {
    const savedPosition = safeSessionStorageGet(SCROLL_POSITION_KEY);
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
        safeSessionStorageRemove(SCROLL_POSITION_KEY);
        shouldRestoreRef.current = false;
      });
    }
  }, [router.pathname]);

  /**
   * Save current scroll position to sessionStorage
   * Call this before navigating away from the search page
   */
  const saveScrollPosition = () => {
    if (typeof window !== 'undefined' && router.pathname === '/search') {
      const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      safeSessionStorageSet(SCROLL_POSITION_KEY, scrollPosition.toString());
    }
  };

  /**
   * Clear saved scroll position
   */
  const clearScrollPosition = () => {
    safeSessionStorageRemove(SCROLL_POSITION_KEY);
  };

  return {
    saveScrollPosition,
    clearScrollPosition,
  };
};
