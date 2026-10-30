import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { expect, test } from 'vitest';
import { createStore, StoreProvider } from '@/store';
import { IUserData } from '@/api/user/types';
import { useUser } from '@/lib/useUser';

const authenticatedUser: IUserData = {
  username: 'test@example.com',
  access_token: 'authenticated-token',
  anonymous: false,
  expires_at: '9999999999999999',
};

const renderUseUser = () => {
  const store = createStore({ user: authenticatedUser });
  // Mirrors the production defaults from useCreateQueryClient, so the cache
  // entry survives invalidation the way it does in the app.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnMount: false, staleTime: Infinity, cacheTime: 5 * 60 * 1000 },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <StoreProvider createStore={() => store}>{children}</StoreProvider>
    </QueryClientProvider>
  );

  const result = renderHook(() => useUser(), { wrapper });
  return { ...result, store, queryClient };
};

test('mirrors a valid store user into the user cache as raw user data', async () => {
  const { queryClient } = renderUseUser();

  await waitFor(() => expect(queryClient.getQueryData(['user'])).toEqual(authenticatedUser));
});

test('reset clears the store user and invalidates the cached identity', async () => {
  const { result, store, queryClient } = renderUseUser();

  await waitFor(() => expect(queryClient.getQueryData(['user'])).toEqual(authenticatedUser));

  await act(async () => {
    await result.current.reset();
  });

  expect(store.getState().user.access_token).toBeUndefined();
  expect(queryClient.getQueryState(['user'])?.isInvalidated).toBe(true);
  expect(queryClient.getQueryData(['user'])).toEqual(authenticatedUser);
});
