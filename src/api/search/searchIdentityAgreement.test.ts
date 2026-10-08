import { describe, expect, test } from 'vitest';

import { AppMode, NumPerPageType } from '@/types';
import { SolrSortField } from '@/api/models';
import { APP_DEFAULTS } from '@/config';
import { clientSearchIdentityInputs, searchIdentity, serverSearchIdentityInputs } from '@/lib/searchIdentity';
import { resolveAppState } from '@/lib/resolveAppState';

type ClientState = {
  mode: AppMode;
  numPerPage: NumPerPageType;
  preferredSearchSort?: SolrSortField;
};

const toNextSearchParams = (url: string): Record<string, string | string[] | undefined> => {
  const query = url.split('?')[1] ?? '';
  const entries: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of new URLSearchParams(query)) {
    const existing = entries[key];
    if (existing === undefined) {
      entries[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      entries[key] = [existing, value];
    }
  }
  return entries;
};

const prefsCookie = (value: Record<string, unknown>) => `scix_prefs=${encodeURIComponent(JSON.stringify(value))}`;

const serverHash = (url: string, cookieHeader = ''): string =>
  searchIdentity(serverSearchIdentityInputs({ searchParams: toNextSearchParams(url), cookieHeader })).queryHash;

const clientHash = (asPath: string, state: ClientState): string =>
  searchIdentity(clientSearchIdentityInputs({ asPath, ...state })).queryHash;

const DEFAULT_CLIENT: ClientState = { mode: AppMode.GENERAL, numPerPage: APP_DEFAULTS.RESULT_PER_PAGE };

describe('server/client search identity agreement — query encoding', () => {
  test.each([
    ['plain query', '/search?q=star'],
    ['spaces as plus', '/search?q=black+holes'],
    ['spaces percent-encoded', '/search?q=black%20holes'],
    ['fielded query with quotes, colon and comma', '/search?q=author%3A%22gaensicke%2C+b%22'],
    ['sort with a space', '/search?q=star&sort=date+desc'],
    ['explicit page', '/search?q=star&p=3'],
    [
      'repeated fq params',
      '/search?q=star&fq=%7B!type%3Daqp+v%3D%24fq_property%7D&fq_property=(property%3A%22refereed%22)',
    ],
    ['year range filter', '/search?q=star&fq_year=year%3A2000-2010'],
    ['unicode in the query', '/search?q=G%C3%B6del'],
    ['ampersand inside a quoted phrase', '/search?q=title%3A%22Sun+%26+Moon%22'],
    ['empty query', '/search?q='],
  ])('%s agrees', (_label, url) => {
    expect(serverHash(url)).toBe(clientHash(url, DEFAULT_CLIENT));
  });

  test('a fragment on the client asPath does not move the identity', () => {
    expect(serverHash('/search?q=star')).toBe(clientHash('/search?q=star#results', DEFAULT_CLIENT));
  });

  test('param order does not move the identity', () => {
    expect(serverHash('/search?q=star&sort=date+desc')).toBe(
      clientHash('/search?sort=date+desc&q=star', DEFAULT_CLIENT),
    );
  });
});

describe('server/client search identity agreement — resolved state', () => {
  test('a mode from the prefs cookie agrees with the rehydrated store', () => {
    const url = '/search?q=star';

    expect(serverHash(url, prefsCookie({ mode: AppMode.ASTROPHYSICS }))).toBe(
      clientHash(url, { ...DEFAULT_CLIENT, mode: AppMode.ASTROPHYSICS }),
    );
  });

  test('no cookie mode agrees with the zustand initial value', () => {
    expect(serverHash('/search?q=star', '')).toBe(clientHash('/search?q=star', DEFAULT_CLIENT));
  });

  test('a discipline param in the URL agrees with the mode the client resolves', () => {
    const url = '/search?q=star&d=heliophysics';

    expect(serverHash(url)).toBe(clientHash(url, { ...DEFAULT_CLIENT, mode: AppMode.HELIOPHYSICS }));
  });

  test('forceMode agrees with the mode the client resolves', () => {
    const url = '/search?q=star&forceMode=astrophysics';

    expect(serverHash(url)).toBe(clientHash(url, { ...DEFAULT_CLIENT, mode: AppMode.ASTROPHYSICS }));
  });

  test('a numPerPage from the prefs cookie agrees with the rehydrated store', () => {
    const url = '/search?q=star';

    expect(serverHash(url, prefsCookie({ numPerPage: 50 }))).toBe(
      clientHash(url, { ...DEFAULT_CLIENT, numPerPage: 50 }),
    );
  });

  test('an authenticated preferred sort agrees when it is in the prefs cookie', () => {
    const url = '/search?q=star';
    const preferredSearchSort: SolrSortField = 'citation_count';

    expect(serverHash(url, prefsCookie({ preferredSearchSort }))).toBe(
      clientHash(url, { ...DEFAULT_CLIENT, preferredSearchSort }),
    );
  });

  test('an explicit URL sort overrides the preference on both sides', () => {
    const url = '/search?q=star&sort=date+desc';

    expect(serverHash(url, prefsCookie({ preferredSearchSort: 'citation_count' }))).toBe(
      clientHash(url, { ...DEFAULT_CLIENT, preferredSearchSort: 'citation_count' }),
    );
  });
});

// AppModeRouter/Notification strip params via replaceState, which the app
// router treats as a navigation, triggering a refetch of the server's seed.
describe('server/client search identity agreement — params the client strips after mount', () => {
  test('stripping forceMode does not move the identity', () => {
    const withParam = clientSearchIdentityInputs({
      asPath: '/search?q=star&forceMode=astrophysics',
      ...DEFAULT_CLIENT,
      mode: AppMode.ASTROPHYSICS,
    });
    const stripped = clientSearchIdentityInputs({
      asPath: '/search?q=star',
      ...DEFAULT_CLIENT,
      mode: AppMode.ASTROPHYSICS,
    });

    expect(searchIdentity(stripped).queryHash).toBe(searchIdentity(withParam).queryHash);
  });

  test('stripping notify does not move the identity', () => {
    const withParam = clientSearchIdentityInputs({
      asPath: '/search?q=star&notify=account-login-success',
      ...DEFAULT_CLIENT,
    });
    const stripped = clientSearchIdentityInputs({ asPath: '/search?q=star', ...DEFAULT_CLIENT });

    expect(searchIdentity(stripped).queryHash).toBe(searchIdentity(withParam).queryHash);
  });

  test('neither param is sent upstream to solr', () => {
    const { searchParams } = searchIdentity(
      clientSearchIdentityInputs({
        asPath: '/search?q=star&forceMode=astrophysics&notify=account-login-success',
        ...DEFAULT_CLIENT,
        mode: AppMode.ASTROPHYSICS,
      }),
    );

    expect(searchParams).not.toHaveProperty('forceMode');
    expect(searchParams).not.toHaveProperty('notify');
  });

  test('the server agrees once the param is gone', () => {
    expect(serverHash('/search?q=star&forceMode=astrophysics')).toBe(
      clientHash('/search?q=star', { ...DEFAULT_CLIENT, mode: AppMode.ASTROPHYSICS }),
    );
  });
});

describe('server/client search identity agreement — genuine divergence still differs', () => {
  test('a numPerPage disagreement is a cache miss', () => {
    expect(serverHash('/search?q=star', prefsCookie({ numPerPage: 50 }))).not.toBe(
      clientHash('/search?q=star', DEFAULT_CLIENT),
    );
  });

  test('a mode disagreement is a cache miss', () => {
    expect(serverHash('/search?q=star', prefsCookie({ mode: AppMode.ASTROPHYSICS }))).not.toBe(
      clientHash('/search?q=star', DEFAULT_CLIENT),
    );
  });

  test('a preferred-sort disagreement is a cache miss', () => {
    expect(serverHash('/search?q=star', '')).not.toBe(
      clientHash('/search?q=star', { ...DEFAULT_CLIENT, preferredSearchSort: 'citation_count' }),
    );
  });

  test('a different query is a cache miss', () => {
    expect(serverHash('/search?q=star')).not.toBe(clientHash('/search?q=planet', DEFAULT_CLIENT));
  });
});

// Client mode comes from the store (seeded by resolveAppState in the layout),
// not the search route's own resolver; the two can drift silently.
describe('server/client search identity agreement — the seed mode matches the dehydrated store mode', () => {
  const layoutMode = (url: string, cookieHeader = ''): AppMode => {
    const { searchParams } = new URL(url, 'http://localhost');
    return (
      resolveAppState({
        pathname: '/search',
        forceModeParam: searchParams.get('forceMode') ?? undefined,
        dParam: searchParams.get('d') ?? undefined,
        cookieHeader,
      }).mode ?? AppMode.GENERAL
    );
  };

  test.each([
    ['no mode signal at all', '/search?q=star', ''],
    ['a discipline param', '/search?q=star&d=heliophysics', ''],
    ['forceMode', '/search?q=star&forceMode=astrophysics', ''],
    ['a cookie mode', '/search?q=star', prefsCookie({ mode: AppMode.ASTROPHYSICS })],
    ['forceMode overriding a cookie', '/search?q=star&forceMode=earth', prefsCookie({ mode: AppMode.ASTROPHYSICS })],
    ['a discipline param overriding a cookie', '/search?q=star&d=planetary', prefsCookie({ mode: AppMode.GENERAL })],
  ])('agrees with %s', (_label, url, cookieHeader) => {
    expect(serverHash(url, cookieHeader)).toBe(
      clientHash(url, { ...DEFAULT_CLIENT, mode: layoutMode(url, cookieHeader) }),
    );
  });
});

describe('server/client search identity agreement — numFound must stay out of the seeding render', () => {
  test('a deep-linked page agrees while neither side knows numFound', () => {
    expect(serverHash('/search?q=star&p=3')).toBe(clientHash('/search?q=star&p=3', DEFAULT_CLIENT));
  });

  test('feeding numFound in on a truncated last page would diverge', () => {
    const server = serverHash('/search?q=star&p=3');
    const client = searchIdentity(
      clientSearchIdentityInputs({ asPath: '/search?q=star&p=3', ...DEFAULT_CLIENT, numFound: 15 }),
    ).queryHash;

    expect(client).not.toBe(server);
  });

  test('a numFound large enough to leave start unclamped still agrees', () => {
    const server = serverHash('/search?q=star&p=3');
    const client = searchIdentity(
      clientSearchIdentityInputs({ asPath: '/search?q=star&p=3', ...DEFAULT_CLIENT, numFound: 1000 }),
    ).queryHash;

    expect(client).toBe(server);
  });
});
