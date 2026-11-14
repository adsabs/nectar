import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render } from '@testing-library/react';
import { rest } from 'msw';
import { useEffect } from 'react';
import { beforeEach, expect, test, TestContext } from 'vitest';
import api from '@/api/api';
import { Store, StoreProvider, useCreateStore } from '@/store';
import type { AppState } from '@/store/types';
import type { IUserData } from '@/api/user/types';
import { useUser } from '@/lib/useUser';
import { UserSync } from './UserSync';

const rejectedUser: IUserData = {
  username: 'test@example.com',
  access_token: 'rejected-token',
  anonymous: false,
  expires_at: '9999999999999999',
};

const refreshedUser: IUserData = {
  username: 'test@example.com',
  access_token: 'refreshed-token',
  anonymous: false,
  expires_at: '9999999999999999',
};

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

beforeEach(() => {
  localStorage.clear();
  api.reset();
});

test('leaves the store user alone when the api recovers from a 401', async ({ server }: TestContext) => {
  let testCalls = 0;
  server.use(
    rest.get('*/api/user', (_req, res, ctx) =>
      res(ctx.status(200), ctx.json({ isAuthenticated: true, user: refreshedUser })),
    ),
    rest.get('*test', (_req, res, ctx) => {
      testCalls += 1;
      return testCalls === 1
        ? res(ctx.status(401), ctx.json({ error: 'Not Authorized' }))
        : res(ctx.status(200), ctx.json({ ok: true }));
    }),
  );

  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnMount: false, staleTime: Infinity, cacheTime: 5 * 60 * 1000 },
    },
  });
  client.setQueryData(['user'], rejectedUser);

  render(<Harness incoming={{ user: rejectedUser }} client={client} />);

  const store = captured.store;
  expect(store).toBeDefined();

  const tokens: (string | undefined)[] = [];
  const unsubscribe = store.subscribe((state: AppState, prev: AppState) => {
    if (state.user !== prev.user) {
      tokens.push(state.user === null ? 'null' : state.user?.access_token);
    }
  });

  api.setUserData(rejectedUser);

  await act(async () => {
    await api.request<{ ok: boolean }>({ method: 'GET', url: '/test' });
  });
  await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
  unsubscribe();

  expect(testCalls).toEqual(2);
  expect(tokens).toEqual([]);
  expect(store.getState().user).toEqual(rejectedUser);
});
