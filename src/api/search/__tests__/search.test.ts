import { MockedRequest } from 'msw';
import { beforeEach, expect, Mock, test, TestContext } from 'vitest';
import { QueryFunctionContext, QueryKey } from '@tanstack/react-query';
import api from '@/api/api';
import { ApiTargets } from '@/api/models';
import { createServerListenerMocks } from '@/test-utils';
import { fetchSearch, SEARCH_NAMESPACES, searchKeys } from '@/api/search/search';

const mockUserData = {
  username: 'anonymous@ads',
  access_token: 'foo_access_token',
  anonymous: true,
  expires_at: '99999999999999999',
};

const queryContext = (queryKey: QueryKey, meta: Record<string, unknown>): QueryFunctionContext => ({
  queryKey,
  meta,
  signal: new AbortController().signal,
});

const requestsTo = (onRequest: Mock, pathname: string): MockedRequest[] =>
  onRequest.mock.calls.map((call) => call[0] as MockedRequest).filter((request) => request.url.pathname === pathname);

beforeEach(() => {
  localStorage.clear();
  api.reset();
  api.setUserData(mockUserData);
});

test('the tag comes from the query key namespace', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  await fetchSearch(
    queryContext(searchKeys.citations({ bibcode: '2021ApJ...123..456A' }), {
      params: { q: 'citations(identifier:"2021ApJ...123..456A")', fl: ['bibcode'], rows: 10 },
    }),
  );

  const [request] = requestsTo(onReq, ApiTargets.SEARCH);
  expect(request.url.searchParams.get('ui_tag')).toEqual('search/citations');
});

test('a namespaced key emits its namespace', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  await fetchSearch(
    queryContext(searchKeys.primary({ q: 'star' }, SEARCH_NAMESPACES.settingsExportSample), {
      params: { q: 'star', fl: ['bibcode'], rows: 1 },
    }),
  );

  const [request] = requestsTo(onReq, ApiTargets.SEARCH);
  expect(request.url.searchParams.get('ui_tag')).toEqual('settings/export-sample');
});

test('a hand-built key with no string namespace emits no tag', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  await fetchSearch(queryContext([{ q: 'star' }], { params: { q: 'star', fl: ['bibcode'], rows: 10 } }));

  const [request] = requestsTo(onReq, ApiTargets.SEARCH);
  expect(request.url.searchParams.get('ui_tag')).toBeNull();
});

test('a key built outside the vocabulary emits no tag rather than leaking it', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);
  const bibcode = '2021ApJ...123..456A';

  await fetchSearch(queryContext([bibcode, { rows: 1 }], { params: { q: `identifier:"${bibcode}"`, rows: 1 } }));

  const [request] = requestsTo(onReq, ApiTargets.SEARCH);
  expect(request.url.searchParams.get('ui_tag')).toBeNull();
});

test('an untrusted ui_tag in the params is dropped, not forwarded to Solr', async ({ server }: TestContext) => {
  const { onRequest: onReq } = createServerListenerMocks(server);

  // Hand-built key resolves no tag, so nothing overwrites the URL's ui_tag.
  await fetchSearch(
    queryContext([{ q: 'star' }], {
      params: { q: 'star', rows: 10, ui_tag: '2021ApJ...123..456A' },
    }),
  );

  const [request] = requestsTo(onReq, ApiTargets.SEARCH);
  expect(request.url.searchParams.get('ui_tag')).toBeNull();
});
