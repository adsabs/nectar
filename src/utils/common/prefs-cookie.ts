import { APP_DEFAULTS } from '@/config';
import { AppMode, NumPerPageType } from '@/types';
import { isNumPerPageType } from '@/utils/common/guards';
import { solrDefaultSortDirection, SolrSortField } from '@/api/models';

const VALID_APP_MODES = new Set(Object.values(AppMode));

export interface SciXPrefs {
  searchMode?: string;
  mode?: string;
  numPerPage?: number;
  dismissedMsg?: string;
  preferredSearchSort?: string;
}

const VALID_SOLR_SORT_FIELDS = new Set<string>(Object.keys(solrDefaultSortDirection));

const isSolrSortField = (value: unknown): value is SolrSortField =>
  typeof value === 'string' && VALID_SOLR_SORT_FIELDS.has(value);

const COOKIE_NAME = 'scix_prefs';
const MAX_AGE = 60 * 60 * 24 * 365;
const COOKIE_RE = new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`);

export const readPrefsCookie = (cookieSource?: string): SciXPrefs => {
  const raw = cookieSource ?? (typeof document !== 'undefined' ? document.cookie : '');
  const match = raw.match(COOKIE_RE);
  if (!match) {
    return {};
  }
  try {
    return JSON.parse(decodeURIComponent(match[1])) as SciXPrefs;
  } catch {
    return {};
  }
};

export const readNumPerPagePref = (cookieSource?: string): NumPerPageType => {
  const numPerPage: unknown = readPrefsCookie(cookieSource).numPerPage;
  return typeof numPerPage === 'number' && isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE;
};

export const readPreferredSearchSortPref = (cookieSource?: string): SolrSortField => {
  const preferredSearchSort: unknown = readPrefsCookie(cookieSource).preferredSearchSort;
  return isSolrSortField(preferredSearchSort) ? preferredSearchSort : APP_DEFAULTS.PREFERRED_SEARCH_SORT;
};

export const readAppModePref = (cookieSource?: string): AppMode | undefined => {
  const mode: unknown = readPrefsCookie(cookieSource).mode;
  return typeof mode === 'string' && VALID_APP_MODES.has(mode as AppMode) ? (mode as AppMode) : undefined;
};

export const readDismissedMsgHash = (cookieSource?: string): string | undefined => {
  const dismissedMsg: unknown = readPrefsCookie(cookieSource).dismissedMsg;
  return typeof dismissedMsg === 'string' && dismissedMsg.length > 0 ? dismissedMsg : undefined;
};

// djb2-style, not cryptographic: no crypto import needed, so it runs the
// same in edge middleware, SSR, and the browser.
export const hashSiteMsg = (msg: string): string => {
  if (!msg) {
    return '';
  }
  let hash = 5381;
  for (let i = 0; i < msg.length; i += 1) {
    hash = (hash * 33) ^ msg.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

export const writePrefsCookie = (updates: Partial<SciXPrefs>): void => {
  if (typeof document === 'undefined') {
    return;
  }
  const current = readPrefsCookie();
  const next: SciXPrefs = { ...current, ...updates };
  (Object.keys(next) as (keyof SciXPrefs)[]).forEach((k) => {
    if (!next[k]) {
      delete next[k];
    }
  });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(next),
  )}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
};
