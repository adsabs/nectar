import { describe, expect, test } from 'vitest';

import { AppMode, NumPerPageType } from '@/types';
import { SolrSortField } from '@/api/models';
import { buildSearchParams } from '@/lib/buildSearchParams';
import { SEARCH_API_KEYS } from '@/api/search/ui-tags';
import { searchQueryIdentity } from '@/api/search/searchQueryIdentity';

// useSearch passes an explicit queryHash as the cache identity; SSR only pays
// off when the server reproduces it byte-for-byte, or the client refetches.

type Inputs = {
  url: string;
  mode: AppMode;
  numPerPage: NumPerPageType;
  preferredSearchSort?: SolrSortField;
  numFound?: number;
};

const identityFor = (inputs: Inputs): string =>
  searchQueryIdentity(buildSearchParams(inputs).searchParams, SEARCH_API_KEYS.primary).queryHash;

describe('searchQueryIdentity', () => {
  test('omits fl and p from the identity', () => {
    const { queryKey, queryHash } = searchQueryIdentity(
      { q: 'star', fl: ['bibcode', 'title'], p: 3, rows: 10 },
      SEARCH_API_KEYS.primary,
    );

    const [namespace, params] = queryKey;
    expect(namespace).toBe(SEARCH_API_KEYS.primary);
    expect(params).not.toHaveProperty('fl');
    expect(params).not.toHaveProperty('p');
    expect(queryHash).toBe(JSON.stringify(queryKey));
  });

  test('is insensitive to fl, so a server fl superset still matches', () => {
    const base = { q: 'star', rows: 10, start: 0 };

    const client = searchQueryIdentity({ ...base, fl: ['bibcode', 'title'] }, SEARCH_API_KEYS.primary);
    const server = searchQueryIdentity(
      { ...base, fl: ['bibcode', 'title', 'abstract', 'esources'] },
      SEARCH_API_KEYS.primary,
    );

    expect(server.queryHash).toBe(client.queryHash);
  });

  test('is sensitive to rows, so a numPerPage mismatch is a cache miss', () => {
    const a = searchQueryIdentity({ q: 'star', rows: 10 }, SEARCH_API_KEYS.primary);
    const b = searchQueryIdentity({ q: 'star', rows: 50 }, SEARCH_API_KEYS.primary);

    expect(a.queryHash).not.toBe(b.queryHash);
  });

  test('is sensitive to boostType, so a mode mismatch is a cache miss', () => {
    const a = searchQueryIdentity({ q: 'star', boostType: 'general' }, SEARCH_API_KEYS.primary);
    const b = searchQueryIdentity({ q: 'star', boostType: 'astrophysics' }, SEARCH_API_KEYS.primary);

    expect(a.queryHash).not.toBe(b.queryHash);
  });

  test('separates namespaces so the primary query cannot collide', () => {
    const primary = searchQueryIdentity({ q: 'star' }, SEARCH_API_KEYS.primary);
    const other = searchQueryIdentity({ q: 'star' }, SEARCH_API_KEYS.abstracts);

    expect(primary.queryHash).not.toBe(other.queryHash);
  });
});

describe('identity sensitivity through buildSearchParams', () => {
  test('ads_compat and d params do not leak into the identity', () => {
    const plain = identityFor({ url: '/search?q=star', mode: AppMode.ASTROPHYSICS, numPerPage: 10 });
    const decorated = identityFor({
      url: '/search?q=star&ads_compat=1&d=astrophysics',
      mode: AppMode.ASTROPHYSICS,
      numPerPage: 10,
    });

    expect(decorated).toBe(plain);
  });

  test('page 2 and page 1 share an identity only when start agrees', () => {
    // `p` is stripped from the identity but `start` is derived from it, so the
    // identity must still distinguish pages.
    const page1 = identityFor({ url: '/search?q=star&p=1', mode: AppMode.GENERAL, numPerPage: 10 });
    const page2 = identityFor({ url: '/search?q=star&p=2', mode: AppMode.GENERAL, numPerPage: 10 });

    expect(page2).not.toBe(page1);
  });
});
