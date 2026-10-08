import qs from 'qs';

import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { searchQueryIdentity } from '@/api/search/searchQueryIdentity';
import { SEARCH_API_KEYS } from '@/api/search/ui-tags';

// Shorter than APP_DEFAULTS.SSR_API_TIMEOUT: chrome and the skeleton paint
// immediately under streaming, so a long budget here only delays the
// client-side fetch fallback, which has its own timeout.
export const SEARCH_SEED_TIMEOUT_MS = 2500;

export interface FetchInitialSearchParams {
  token: string | undefined;
  solrParams: IADSApiSearchParams;
}

export interface FetchInitialSearchResult {
  data: IADSApiSearchResponse;
  queryHash: string;
}

// A 200 with a JSON error body (e.g. { error: 'upstream gateway' }) is
// otherwise indistinguishable from a real response.
const isSearchResponse = (body: unknown): body is IADSApiSearchResponse =>
  typeof body === 'object' &&
  body !== null &&
  Array.isArray((body as { response?: { docs?: unknown } }).response?.docs);

export const fetchInitialSearch = async ({
  token,
  solrParams,
}: FetchInitialSearchParams): Promise<FetchInitialSearchResult | null> => {
  if (!token) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_SEED_TIMEOUT_MS);

  try {
    const query = qs.stringify(solrParams, { arrayFormat: 'repeat' });
    const response = await fetch(`${process.env.API_HOST_SERVER}/search/query?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const body: unknown = await response.json();
    if (!isSearchResponse(body)) {
      return null;
    }

    const { queryHash } = searchQueryIdentity(solrParams, SEARCH_API_KEYS.primary);

    return { data: body, queryHash };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};
