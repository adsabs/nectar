import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { render } from '@/test-utils';
import { searchIdentity, serverSearchIdentityInputs } from '@/lib/searchIdentity';
import { writePrefsCookie } from '@/utils/common/prefs-cookie';
import { SearchPage } from './SearchPage';

const AS_PATH = '/search?q=star';
const PAYLOAD = {
  response: { numFound: 1, docs: [{ bibcode: '2024AAA...1....1X', title: ['Seeded from the server'] }] },
};

const mocks = vi.hoisted(() => ({
  asPath: { current: '/search?q=star' },
  useSearch: vi.fn(),
  settings: { current: { preferredSearchSort: 'score' } as Record<string, unknown> },
  isPlaceholderData: { current: true },
}));

vi.mock('@/api/search/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search/search')>();
  return { ...actual, useSearch: mocks.useSearch };
});

// Stable per asPath: several effects here depend on router.query, and a fresh
// object each render re-runs them forever.
const routerCache = new Map<string, unknown>();
const routerFor = (asPath: string): unknown => {
  const existing = routerCache.get(asPath);
  if (existing !== undefined) {
    return existing;
  }
  const params = new URLSearchParams(asPath.split('?')[1] ?? '');
  const query: Record<string, string> = {};
  params.forEach((value, key) => {
    query[key] = value;
  });
  const router = {
    pathname: '/search',
    asPath,
    query,
    searchParams: params,
    push: vi.fn(),
    replace: vi.fn(),
    onNavigateStart: (): (() => void) => () => undefined,
    onNavigateComplete: (): (() => void) => () => undefined,
  };
  routerCache.set(asPath, router);
  return router;
};

vi.mock('@/lib/useRouterCompat', () => ({
  useRouterCompat: () => routerFor(mocks.asPath.current),
}));

vi.mock('@/lib/useSettings', () => ({
  useSettings: () => ({
    settings: mocks.settings.current,
    updateSettings: vi.fn(),
    getSettingsState: { isFetching: false, isPlaceholderData: mocks.isPlaceholderData.current },
  }),
}));

vi.mock('@/components/ResultList', () => ({
  SimpleResultList: () => <div data-testid="result-list" />,
  ListActions: () => <div />,
  Pagination: () => <div />,
  ItemsSkeleton: () => <div />,
}));

vi.mock('@/components/SearchFacet', () => ({ SearchFacets: () => <div /> }));
vi.mock('@/components/SearchFacet/FacetFilters', () => ({ FacetFilters: () => <div /> }));
vi.mock('@/components/Libraries', () => ({ AddToRemoveFromLibraryModal: () => <div /> }));
vi.mock('@/components/NavBar', () => ({ getResultsSteps: (): [] => [] }));

const serverHash = (cookieHeader: string): string =>
  searchIdentity(serverSearchIdentityInputs({ searchParams: { q: 'star' }, cookieHeader })).queryHash;

const optionsOfCall = (index: number) => mocks.useSearch.mock.calls[index]?.[1] as Record<string, unknown>;
const lastOptions = () => optionsOfCall(mocks.useSearch.mock.calls.length - 1);

beforeEach(() => {
  mocks.useSearch.mockReset();
  mocks.useSearch.mockReturnValue({
    data: PAYLOAD,
    isSuccess: true,
    isLoading: false,
    isFetching: false,
    error: null,
    isError: false,
    refetch: vi.fn(),
  });
  mocks.settings.current = { preferredSearchSort: 'score' };
  mocks.isPlaceholderData.current = true;
  mocks.asPath.current = AS_PATH;
});

afterEach(() => {
  document.cookie = 'scix_prefs=; Max-Age=0; Path=/';
});

describe('SearchPage initialData seeding', () => {
  test('seeds the query when the server hash matches', () => {
    render(<SearchPage initialData={PAYLOAD} initialQueryHash={serverHash('')} />);

    expect(optionsOfCall(0).initialData).toEqual(PAYLOAD);
  });

  // The gate exists because a mismatched seed would be frozen into the cache by
  // staleTime: Infinity and never corrected.
  test('refuses a seed whose hash belongs to a different query', () => {
    render(<SearchPage initialData={PAYLOAD} initialQueryHash="not-the-hash" />);

    expect(optionsOfCall(0).initialData).toBeUndefined();
  });

  test('passes no seed when the server did not provide one', () => {
    render(<SearchPage />);

    expect(optionsOfCall(0).initialData).toBeUndefined();
  });

  // Replaying the same payload under a later queryKey would serve page 1 results
  // for page 2.
  test('stops offering the seed after the first mount', () => {
    const { rerender } = render(<SearchPage initialData={PAYLOAD} initialQueryHash={serverHash('')} />);

    rerender(<SearchPage initialData={PAYLOAD} initialQueryHash={serverHash('')} />);

    expect(lastOptions().initialData).toBeUndefined();
  });

  // The cohort the server fetch is wasted on: an authenticated user whose sort
  // preference is still only in the cookie because the settings query has not
  // resolved yet.
  test('seeds a user whose preferred sort is known only from the cookie', () => {
    writePrefsCookie({ preferredSearchSort: 'citation_count' });

    render(<SearchPage initialData={PAYLOAD} initialQueryHash={serverHash(document.cookie)} />);

    expect(optionsOfCall(0).initialData).toEqual(PAYLOAD);
  });
});

// Refinements use shallow pushState, which skips generateMetadata, and
// next/head is inert in the app directory — this effect is what's left.
describe('SearchPage document title', () => {
  test('names the query in the tab title', () => {
    render(<SearchPage initialData={PAYLOAD} initialQueryHash={serverHash('')} />);

    expect(document.title).toBe('star - Science Explorer Search');
  });

  test('tracks a refinement to a different query', () => {
    const { rerender } = render(<SearchPage initialData={PAYLOAD} initialQueryHash={serverHash('')} />);
    expect(document.title).toBe('star - Science Explorer Search');

    mocks.asPath.current = '/search?q=planet';
    rerender(<SearchPage initialData={PAYLOAD} initialQueryHash={serverHash('')} />);

    expect(document.title).toBe('planet - Science Explorer Search');
  });

  test('truncates a query too long for a tab', () => {
    mocks.asPath.current = `/search?q=${'a'.repeat(400)}`;

    render(<SearchPage />);

    expect(document.title).toContain('…');
    expect(document.title.length).toBeLessThan(400);
  });
});
