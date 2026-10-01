import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { ReactNode } from 'react';
import { expect, test, TestContext, vi } from 'vitest';
import { createServerListenerMocks } from '@/test-utils';
import { createStore, Store, StoreProvider } from '@/store';
import { userKeys } from '@/api/user/user';
import { IUserData } from '@/api/user/types';
import { UserSync } from './UserSync';

const mockUserData: IUserData = {
  username: 'test',
  access_token: 'test',
  anonymous: false,
  expires_at: '9999999999999999',
};

const renderUserSync = (options?: { store?: Store; queryClient?: QueryClient }) => {
  const store = options?.store ?? createStore({});
  const queryClient =
    options?.queryClient ??
    new QueryClient({
      defaultOptions: { queries: { retry: false, cacheTime: 0, staleTime: 0 } },
    });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <StoreProvider createStore={() => store}>{children}</StoreProvider>
    </QueryClientProvider>
  );

  const result = render(<UserSync />, { wrapper });
  return { ...result, store, queryClient };
};

const userRequests = (onRequest: ReturnType<typeof createServerListenerMocks>['onRequest']) =>
  onRequest.mock.calls.map(([req]) => req).filter((req) => req.url.pathname === '/api/user');

test('fetches /api/user without forcing a token refresh', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);

  const { store } = renderUserSync();

  await waitFor(() => expect(store.getState().user).toEqual(mockUserData));

  const requests = userRequests(onRequest);
  expect(requests).toHaveLength(1);
  expect(requests[0].headers.get('x-refresh-token')).toBeNull();
});

test('syncs the fetched user into the store', async ({ server }: TestContext) => {
  server.use(
    rest.get('*/api/user', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json({ isAuthenticated: true, user: { ...mockUserData, access_token: 'fetched' } })),
    ),
  );

  const { store } = renderUserSync();

  await waitFor(() => expect(store.getState().user.access_token).toEqual('fetched'));
});

test('reads the server-seeded cache entry without refetching', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnMount: false, staleTime: Infinity } },
  });
  // Matches the shape ssr-utils.ts seeds into ['user'].
  queryClient.setQueryData(['user'], { ...mockUserData, access_token: 'seeded' });

  const { store } = renderUserSync({ queryClient });

  await waitFor(() => expect(store.getState().user.access_token).toEqual('seeded'));
  expect(userRequests(onRequest)).toHaveLength(0);
});

test('invalidates cached user settings when the token changes', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, cacheTime: 0, staleTime: 0 } },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

  const { store } = renderUserSync({ queryClient });

  await waitFor(() => expect(store.getState().user).toEqual(mockUserData));
  expect(invalidateQueries).toHaveBeenCalledWith(userKeys.getUserSettings());
});

test('leaves the store alone when the fetched token is expired', async ({ server }: TestContext) => {
  server.use(
    rest.get('*/api/user', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json({ isAuthenticated: false, user: { ...mockUserData, expires_at: '1' } })),
    ),
  );

  const { store, queryClient } = renderUserSync();

  await waitFor(() => expect(queryClient.getQueryData(['user'])).toBeDefined());
  expect(store.getState().user.access_token).toBeUndefined();
});

test('does not re-apply a cached token after the api rejects the identity', async () => {
  const store = createStore({ user: mockUserData });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnMount: false, staleTime: Infinity, cacheTime: 5 * 60 * 1000 },
    },
  });
  queryClient.setQueryData(['user'], mockUserData);

  renderUserSync({ store, queryClient });

  await waitFor(() => expect(store.getState().user).toEqual(mockUserData));

  // Api.invalidateUserData() clears the store user to null on a 401 but leaves
  // the ['user'] cache entry in place.
  act(() => {
    store.setState({ user: null });
  });

  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(store.getState().user).toBeNull();
});
