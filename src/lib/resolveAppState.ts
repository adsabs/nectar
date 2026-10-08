import { AppMode } from '@/types';
import type { AppState } from '@/store/types';
import { isUserData } from '@/auth-utils';
import { IUserData } from '@/api/user/types';
import { readAppModePref, readPrefsCookie } from '@/utils/common/prefs-cookie';
import { SearchMode } from '@/utils/common/search-mode-constants';
import { SEARCH_PAGE_PATHNAMES } from '@/utils/appMode';
import { getNotification, NotificationId } from '@/store/slices/notification';
import { resolveAppMode } from '@/lib/resolveAppMode';

const VALID_SEARCH_MODES = new Set(Object.values(SearchMode));

export interface ResolveAppStateParams {
  pathname: string;
  forceModeParam?: string | string[];
  dParam?: string | string[];
  notifyParam?: string | string[];
  cookieHeader?: string;
  userData?: IUserData;
}

export type ResolvedAppState = {
  user: AppState['user'];
  notification: ReturnType<typeof getNotification>;
} & Partial<Pick<AppState, 'mode' | 'searchMode'>>;

export const resolveAppState = ({
  pathname,
  forceModeParam,
  dParam,
  notifyParam,
  cookieHeader,
  userData,
}: ResolveAppStateParams): ResolvedAppState => {
  const prefs = readPrefsCookie(cookieHeader);
  const resolvedMode = resolveAppMode({
    forceModeParam,
    dParam,
    allowDisciplineParam: SEARCH_PAGE_PATHNAMES.has(pathname),
    cookieMode: readAppModePref(cookieHeader),
  });

  const cookieSearchMode =
    prefs.searchMode && VALID_SEARCH_MODES.has(prefs.searchMode as SearchMode) && resolvedMode === AppMode.ASTROPHYSICS
      ? prefs.searchMode
      : undefined;

  return {
    user: (isUserData(userData) ? userData : {}) as AppState['user'],
    notification: getNotification(notifyParam as NotificationId),
    ...(resolvedMode && { mode: resolvedMode }),
    ...(cookieSearchMode && { searchMode: cookieSearchMode }),
  };
};
