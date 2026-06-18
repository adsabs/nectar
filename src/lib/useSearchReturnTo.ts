import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { removeSessionItem, setSessionItem, SessionStorageKey } from '@/lib/session/sessionStore';
import { useSessionValue } from '@/lib/session/useSessionValue';

const RESULTS_PATHNAME = '/search';

export interface UseSearchReturnToOptions {
  /** Explicit highest-precedence target (e.g. the library export `referrer`). */
  referrer?: string | null;
  /** A return target reconstructed from the current page's own URL. */
  reconstructed?: string | null;
  /**
   * When true, `reconstructed` (if present) outranks the captured session URL.
   * Used by viz pages whose own URL is canonical.
   */
  preferReconstructed?: boolean;
}

export interface SearchReturnTo {
  /** Resolved target, or null when none is available (hide the control). */
  returnTo: string | null;
}

/**
 * Resolves the best "back to search results" target for this tab.
 *
 * Precedence: referrer -> captured session URL -> page-reconstructable URL -> none.
 * Viz pages pass `preferReconstructed` to flip the middle two, since their own
 * URL is as canonical as the captured one.
 *
 * The session read is SSR-safe (null on server + first client render), so a
 * control gated on `returnTo` renders nothing until hydration resolves it.
 */
export const useSearchReturnTo = (options: UseSearchReturnToOptions = {}): SearchReturnTo => {
  const { referrer = null, reconstructed = null, preferReconstructed = false } = options;
  const { value: sessionUrl, isReady } = useSessionValue<string>(SessionStorageKey.SearchReturnUrl);

  // referrer and (for viz pages) reconstructed are known synchronously and
  // outrank the session URL, so they resolve immediately and SSR-stably.
  if (referrer) {
    return { returnTo: referrer };
  }

  if (preferReconstructed && reconstructed) {
    return { returnTo: reconstructed };
  }

  // The session URL outranks reconstructed. Until the client read completes we
  // can't tell "no session URL" from "not read yet", so hide rather than show a
  // lower-precedence target that would flip after mount.
  if (!isReady) {
    return { returnTo: null };
  }

  return { returnTo: sessionUrl ?? reconstructed };
};

/** Persist a results-page URL as this tab's return target. */
export const captureSearchReturnUrl = (asPath: string): void => {
  setSessionItem(SessionStorageKey.SearchReturnUrl, asPath);
};

/** Forget this tab's captured return target. */
export const clearSearchReturnUrl = (): void => {
  removeSessionItem(SessionStorageKey.SearchReturnUrl);
};

const hasQuery = (q: string | string[] | undefined): boolean =>
  Array.isArray(q) ? q.length > 0 : typeof q === 'string' && q.length > 0;

/**
 * Captures the current `/search` results URL so other pages can offer a
 * reliable "back to results" link.
 *
 * Runs client-side once the route has settled (`router.isReady`) and only for
 * an actual results view (results pathname with a `q` param), so transient,
 * param-less, or non-results URLs are never stored.
 */
export const useCaptureSearchReturnUrl = (): void => {
  const router = useRouter();

  // Capture after the route settles so we never store a transient/SSR-default URL.
  useEffect(() => {
    if (!router.isReady || router.pathname !== RESULTS_PATHNAME || !hasQuery(router.query.q)) {
      return;
    }
    captureSearchReturnUrl(router.asPath);
  }, [router.isReady, router.pathname, router.asPath, router.query.q]);
};
