export interface SciXPrefs {
  searchMode?: string;
  mode?: string;
}

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
