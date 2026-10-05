import { ApiTargets } from '@/api/models';

const FETCH_TIMEOUT_MS = 3000;
export const SITE_WIDE_MSG_TTL_MS = 300_000;
// Short relative to the success TTL: bounds how long a vault outage blocks
// RootLayout, which awaits this before emitting any HTML.
export const SITE_WIDE_MSG_ERROR_TTL_MS = 30_000;

interface CacheEntry {
  message: string;
  expiresAt: number;
}

interface ErrorEntry {
  expiresAt: number;
}

let cacheEntry: CacheEntry | undefined;
let errorEntry: ErrorEntry | undefined;
let pendingFetch: Promise<string | null> | undefined;
let pendingRefresh: Promise<void> | undefined;

const fetchSiteWideMsgUpstream = async (token: string): Promise<string | null> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${process.env.API_HOST_SERVER}${ApiTargets.SITE_SIDE_MESSAGE}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const body: unknown = await response.json();
    let message: string;
    if (typeof body === 'string') {
      message = body;
    } else if (body === null || body === undefined) {
      message = '';
    } else {
      return null;
    }

    cacheEntry = { message, expiresAt: Date.now() + SITE_WIDE_MSG_TTL_MS };
    errorEntry = undefined;
    return message;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

// At most one refresh in flight; while stale, the next read starts another
// once this clears, so a sustained outage retries roughly once per
// FETCH_TIMEOUT_MS forever. Safe since it never blocks the critical path.
const refreshInBackground = (token: string): void => {
  if (pendingRefresh) {
    return;
  }

  pendingRefresh = fetchSiteWideMsgUpstream(token)
    .then((): void => undefined)
    .catch((): void => undefined)
    .finally(() => {
      pendingRefresh = undefined;
    });
};

export const fetchSiteWideMsgServer = async (token?: string): Promise<string | null> => {
  if (!token) {
    return null;
  }

  const now = Date.now();

  if (cacheEntry) {
    if (cacheEntry.expiresAt > now) {
      return cacheEntry.message;
    }

    refreshInBackground(token);
    return cacheEntry.message;
  }

  if (errorEntry && errorEntry.expiresAt > now) {
    return null;
  }

  if (!pendingFetch) {
    pendingFetch = fetchSiteWideMsgUpstream(token).finally(() => {
      pendingFetch = undefined;
    });
  }

  const result = await pendingFetch;
  if (result === null) {
    errorEntry = { expiresAt: Date.now() + SITE_WIDE_MSG_ERROR_TTL_MS };
  }

  return result;
};
