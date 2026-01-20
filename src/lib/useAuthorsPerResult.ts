import { APP_DEFAULTS } from '@/config';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';

/**
 * Returns the number of authors to display per search result based on user preferences.
 *
 * - Non-authenticated users: returns default (4)
 * - Authenticated users: returns their minAuthorsPerResult preference
 * - "all" preference: returns MAX_AUTHORS_PER_RESULT_OPTION (capped for UX/performance)
 */
export function useAuthorsPerResult(): number {
  const { isAuthenticated } = useSession();
  const { settings } = useSettings({ enabled: isAuthenticated }, true);

  if (!isAuthenticated) {
    return APP_DEFAULTS.DEFAULT_AUTHORS_PER_RESULT;
  }

  const value = settings.minAuthorsPerResult;

  // Backwards compatibility: treat legacy "all" as max
  if (value?.toLowerCase() === 'all') {
    return APP_DEFAULTS.MAX_AUTHORS_PER_RESULT_OPTION;
  }

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? APP_DEFAULTS.DEFAULT_AUTHORS_PER_RESULT : parsed;
}
