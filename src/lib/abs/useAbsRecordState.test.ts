import { createElement, ReactNode } from 'react';
import { MockedRequest, rest } from 'msw';
import { beforeEach, describe, expect, Mock, test, TestContext, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NextRouter } from 'next/router';

import api from '@/api/api';
import { ApiTargets } from '@/api/models';
import { searchKeys } from '@/api/search/search';
import { IADSApiSearchResponse, IDocsEntity } from '@/api/search/types';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { createServerListenerMocks } from '@/test-utils';
import { AbsSSRResult } from './absRecordState';
import { useAbsRecordState } from './useAbsRecordState';

const mockUserData = {
  username: 'anonymous@ads',
  access_token: 'foo_access_token',
  anonymous: true,
  expires_at: '99999999999999999',
};

let mockRouter: NextRouter;
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

const captureMessage = vi.fn();
vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

const createMockRouter = (query: NextRouter['query'] = {}): NextRouter =>
  ({
    basePath: '',
    pathname: '/abs/[id]/abstract',
    route: '/abs/[id]/abstract',
    asPath: '/abs/BIB/abstract',
    query,
    isReady: true,
    isLocaleDomain: false,
    isPreview: false,
    isFallback: false,
    push: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  } as unknown as NextRouter);

const createProdQueryClient = (overrides: Record<string, unknown> = {}) =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        cacheTime: 30 * 60 * 1000,
        retry: false,
        retryOnMount: false,
        ...overrides,
      },
    },
  });

const searchRequests = (onRequest: Mock): Array<string | null> =>
  onRequest.mock.calls
    .map((call) => call[0] as MockedRequest)
    .filter((request) => request.url.pathname === ApiTargets.SEARCH)
    .map((request) => request.url.searchParams.get('q'));

const BIBCODE = '2021ApJ...123..456A';

const renderAbsState = (
  args: { ssr?: AbsSSRResult; queryId?: string; initialDoc?: IDocsEntity | null },
  client: QueryClient,
) => {
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useAbsRecordState(args), { wrapper });
};

beforeEach(() => {
  localStorage.clear();
  api.reset();
  api.setUserData(mockUserData);
  captureMessage.mockReset();
  mockRouter = createMockRouter({ id: BIBCODE });
});

describe('useAbsRecordState', () => {
  test('dropped SSR props recover from the router id and resolve to content', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    const client = createProdQueryClient();

    const { result } = renderAbsState({ ssr: undefined, queryId: undefined }, client);

    await waitFor(() => expect(result.current.state.kind).toBe('content'), { timeout: 4_000 });

    expect(searchRequests(onRequest)).toEqual([`identifier:"${BIBCODE}"`]);
    expect(result.current.doc).toBeDefined();
  });

  test('dropped SSR props with no router id stay terminal and never fetch', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockRouter = createMockRouter({});
    const client = createProdQueryClient();

    const { result } = renderAbsState({ ssr: undefined, queryId: undefined }, client);

    await waitFor(() => expect(result.current.state.kind).not.toBe('loading'), { timeout: 4_000 });
    expect(result.current.state).toEqual({ kind: 'error', statusCode: 500 });
    expect(searchRequests(onRequest)).toEqual([]);
  });

  test('a non-string router id is not usable and stays terminal', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockRouter = createMockRouter({ id: ['a', 'b'] });
    const client = createProdQueryClient();

    const { result } = renderAbsState({ ssr: undefined, queryId: undefined }, client);

    await waitFor(() => expect(result.current.state.kind).not.toBe('loading'), { timeout: 4_000 });
    expect(searchRequests(onRequest)).toEqual([]);
  });

  test('an SSR queryId takes precedence over the router id', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockRouter = createMockRouter({ id: 'BIB-FROM-ROUTER' });
    const client = createProdQueryClient();

    const { result } = renderAbsState(
      { ssr: { outcome: 'error', statusCode: 503, reason: 'fetch-not-ok' }, queryId: 'BIB-FROM-SSR' },
      client,
    );

    await waitFor(() => expect(result.current.state.kind).toBe('content'), { timeout: 4_000 });
    expect(searchRequests(onRequest)).toEqual(['identifier:"BIB-FROM-SSR"']);
  });

  test('the router id is used verbatim, never decoded a second time', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    mockRouter = createMockRouter({ id: 'arXiv:2101%2F12345' });
    const client = createProdQueryClient();

    const { result } = renderAbsState({ ssr: undefined, queryId: undefined }, client);

    await waitFor(() => expect(result.current.state.kind).toBe('content'), { timeout: 4_000 });
    expect(searchRequests(onRequest)).toEqual(['identifier:"arXiv:2101%2F12345"']);
  });

  test('a seeded cache resolves without a request under production query defaults', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    const client = createProdQueryClient();
    const seeded: IADSApiSearchResponse = {
      response: { numFound: 1, docs: [{ bibcode: BIBCODE } as IDocsEntity] },
    };
    client.setQueryData(searchKeys.abstract(BIBCODE), seeded);

    const { result } = renderAbsState({ ssr: { outcome: 'found' }, queryId: BIBCODE }, client);

    await waitFor(() => expect(result.current.state.kind).toBe('content'), { timeout: 4_000 });
    expect(searchRequests(onRequest)).toEqual([]);
  });

  test('a router-recovered record still reports the SSR false negative', async ({ server }: TestContext) => {
    createServerListenerMocks(server);
    const client = createProdQueryClient();

    const { result } = renderAbsState({ ssr: undefined, queryId: undefined }, client);

    await waitFor(() => expect(result.current.state.kind).toBe('content'), { timeout: 4_000 });
    expect(captureMessage).toHaveBeenCalledWith(
      'abs_ssr_false_negative_recovered',
      expect.objectContaining({ level: 'warning' }),
    );
  });

  test('a recovery from dropped props is distinguishable from an SSR fetch failure', async ({
    server,
  }: TestContext) => {
    createServerListenerMocks(server);
    const client = createProdQueryClient();

    const { result } = renderAbsState({ ssr: undefined, queryId: undefined }, client);
    await waitFor(() => expect(result.current.state.kind).toBe('content'), { timeout: 4_000 });

    expect(captureMessage).toHaveBeenCalledWith(
      'abs_ssr_false_negative_recovered',
      expect.objectContaining({
        contexts: { absRecord: expect.objectContaining({ ssrReason: 'missing-ssr-props' }) },
      }),
    );
  });

  test('a router-recovered id whose fetch fails settles on error, not a stuck skeleton', async ({
    server,
  }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    server.use(rest.get(apiHandlerRoute(ApiTargets.SEARCH), (_req, res, ctx) => res(ctx.status(500))));
    const client = createProdQueryClient({ retryDelay: 0 });

    const { result } = renderAbsState({ ssr: undefined, queryId: undefined }, client);

    await waitFor(() => expect(result.current.state.kind).toBe('error'), { timeout: 4_000 });

    expect(searchRequests(onRequest)).toEqual([
      `identifier:"${BIBCODE}"`,
      `identifier:"${BIBCODE}"`,
      `identifier:"${BIBCODE}"`,
    ]);
    expect(result.current.state).toEqual({ kind: 'error', statusCode: 500 });
  });

  test('a genuine SSR fetch failure reports its own reason', async ({ server }: TestContext) => {
    createServerListenerMocks(server);
    const client = createProdQueryClient();

    const { result } = renderAbsState(
      { ssr: { outcome: 'error', statusCode: 503, reason: 'fetch-not-ok' }, queryId: BIBCODE },
      client,
    );
    await waitFor(() => expect(result.current.state.kind).toBe('content'), { timeout: 4_000 });

    expect(captureMessage).toHaveBeenCalledWith(
      'abs_ssr_false_negative_recovered',
      expect.objectContaining({
        contexts: { absRecord: expect.objectContaining({ ssrReason: 'fetch-not-ok' }) },
      }),
    );
  });
});
