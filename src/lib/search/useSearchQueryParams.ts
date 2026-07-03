import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { parseAsBoolean, parseAsInteger, parseAsNativeArrayOf, parseAsString, useQueryStates } from 'nuqs';

import { APP_DEFAULTS } from '@/config';
import { SolrSortField } from '@/api/models';
import { useStore } from '@/store';
import { useSession } from '@/lib/useSession';
import { useSettings } from '@/lib/useSettings';
import { canonicalSearchParams, CanonicalSearchParams } from '@/utils/common/search';

// Parsers for the search params this page owns. fq and sort use native arrays
// (nuqs 2.7+) — the URL contract serializes both as repeated keys (?fq=A&fq=B),
// and fq values can legitimately contain commas. sort and rows have no static
// default on purpose: absence means "resolve from the user's settings", which
// canonicalSearchParams applies.
export const searchParamsParsers = {
  q: parseAsString.withDefault(''),
  sort: parseAsNativeArrayOf(parseAsString),
  p: parseAsInteger.withDefault(1),
  rows: parseAsInteger,
  fq: parseAsNativeArrayOf(parseAsString),
  showHighlights: parseAsBoolean.withDefault(false),
};

// history push + Next-shallow + no scroll matches the previous page's
// router.push(..., { shallow: true, scroll: false }) navigation exactly
const NUQS_OPTIONS = { history: 'push' as const, shallow: true, scroll: false };

export type SearchQueryParamsSetter = ReturnType<typeof useQueryStates<typeof searchParamsParsers>>[1];

// URL state for the search page. The URL is the single source of truth:
// declared params are read/written through nuqs (which reads from router.query
// and writes through the Next router, so router.asPath and route events stay
// accurate); dynamic facet companion params (fq_author, ...) pass through from
// router.query into the canonical params.
export const useSearchQueryParams = () => {
  const router = useRouter();
  const [urlState, setParams] = useQueryStates(searchParamsParsers, NUQS_OPTIONS);
  const { isAuthenticated } = useSession();
  const { settings, getSettingsState } = useSettings({ suspense: false });
  const numPerPage = useStore((state) => state.numPerPage);

  const preferredSortField = (settings?.preferredSearchSort ?? APP_DEFAULTS.PREFERRED_SEARCH_SORT) as SolrSortField;

  const params: CanonicalSearchParams = useMemo(
    () => canonicalSearchParams({ ...router.query, ...urlState }, { preferredSortField, numPerPage }),
    // router.query identity changes on every navigation; urlState is stable via nuqs
    [router.query, urlState, preferredSortField, numPerPage],
  );

  // Stamp resolved sort/rows into the URL when they're absent so every history
  // entry captures the full search state — otherwise a later change to the
  // user's preferred sort or page size silently changes what old URLs mean.
  // For authenticated users, wait for settings so the preferred sort (not the
  // static default) is what gets written. Guarded to one stamp per URL: this
  // is arrival-time canonicalization, and re-firing on later renders could
  // race a concurrent user navigation with stale values.
  const needsSort = urlState.sort === null || urlState.sort.length === 0;
  const needsRows = urlState.rows === null;
  const isSettingsReady = !isAuthenticated || getSettingsState.isFetched;
  const stampedUrlRef = useRef<string | null>(null);
  useEffect(() => {
    if (!router.isReady || !isSettingsReady || (!needsSort && !needsRows)) {
      return;
    }
    if (stampedUrlRef.current === router.asPath) {
      return;
    }
    stampedUrlRef.current = router.asPath;
    void setParams(
      {
        ...(needsSort ? { sort: params.sort } : {}),
        ...(needsRows ? { rows: params.rows } : {}),
      },
      { history: 'replace' },
    );
  }, [router.isReady, router.asPath, isSettingsReady, needsSort, needsRows, params.sort, params.rows, setParams]);

  return {
    params,
    setParams,
    showHighlights: urlState.showHighlights,
    // the raw (uncanonicalized) q — empty string when the URL has no query
    rawQuery: urlState.q,
    isReady: router.isReady,
  };
};
