import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { useEffect } from 'react';
import { expect, test, TestContext } from 'vitest';
import { Store, StoreProvider, useCreateStore } from '@/store';
import type { AppState } from '@/store/types';
import type { IUserData } from '@/api/user/types';
import { useUser } from '@/lib/useUser';
import { UserSync } from './UserSync';

const ssrUser: IUserData = {
  username: 'test@example.com',
  access_token: 'ssr-token',
  anonymous: false,
  expires_at: '9999999999999999',
};

const liveUser: IUserData = {
  username: 'test@example.com',
  access_token: 'live-token',
  anonymous: false,
  expires_at: '9999999999999999',
};

const RESET_SEARCH_FACETS_DELAY = 300;

const captured: { store?: Store } = {};

const UserConsumer = (): null => {
  useUser();
  return null;
};

const Harness = ({ incoming, client }: { incoming: Partial<AppState>; client: QueryClient }) => {
  const createStore = useCreateStore(incoming);

  useEffect(() => {
    captured.store = createStore();
  }, [createStore]);

  return (
    <StoreProvider createStore={createStore}>
      <QueryClientProvider client={client}>
        <UserSync />
        <UserConsumer />
      </QueryClientProvider>
    </StoreProvider>
  );
};

test('converges in one store write when the SSR token differs from the live token', async ({ server }: TestContext) => {
  server.use(
    rest.get('*/api/user', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json({ isAuthenticated: true, user: liveUser })),
    ),
  );

  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnMount: false, staleTime: Infinity, cacheTime: 5 * 60 * 1000 },
    },
  });

  const { rerender } = render(<Harness incoming={{ user: ssrUser }} client={client} />);

  const store = captured.store;
  expect(store).toBeDefined();
  expect(store.getState().user.access_token).toEqual('ssr-token');

  const userWrites: IUserData[] = [];
  const unsubscribe = store.subscribe((state: AppState, prev: AppState) => {
    if (state.user !== prev.user) {
      userWrites.push(state.user as IUserData);
    }
  });

  await waitFor(() => expect(store.getState().user.access_token).toEqual('live-token'));

  await act(async () => {
    rerender(<Harness incoming={{ user: { ...ssrUser }, numPerPage: 50 }} client={client} />);
  });

  await act(() => new Promise((resolve) => setTimeout(resolve, RESET_SEARCH_FACETS_DELAY + 100)));

  unsubscribe();

  expect(store.getState().numPerPage).toEqual(50);
  expect(store.getState().user.access_token).toEqual('live-token');
  expect(userWrites.map((write) => write.access_token)).toEqual(['live-token']);
});
