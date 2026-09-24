import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ThemeProvider } from '@chakra-ui/react';
import { StoreProvider, createStore } from '@/store';
import { ApiTargets } from '@/api/models';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { server } from '@/mocks/server';
import { theme } from '@/theme';
import mockOrcidUser from '@/mocks/responses/orcid/exchangeOAuthCode.json';
import { useOrcid } from './useOrcid';

const mocks = vi.hoisted(() => ({
  toast: Object.assign(vi.fn(), { isActive: vi.fn(() => false) }),
  useRouter: vi.fn(() => ({
    pathname: '/',
    query: {},
    asPath: '/',
    push: vi.fn(),
    replace: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return { ...actual, useToast: () => mocks.toast };
});

// Mirrors src/lib/useCreateQueryClient.ts. The bug only reproduces under these
// defaults, so the shared test-utils client (staleTime/cacheTime 0) is no use.
const createProdQueryClient = () =>
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
      },
    },
  });

const orcidState = {
  active: true,
  isAuthenticated: true,
  user: mockOrcidUser,
  lastActivityAt: Date.now(),
};

const renderOrcid = (queryClient: QueryClient) => {
  const store = createStore({ orcid: orcidState });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider createStore={() => store}>{children}</StoreProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  return renderHook(() => useOrcid(), { wrapper });
};

describe('useOrcid — cached profile errors under the real QueryClient', () => {
  let profileRequests = 0;

  beforeEach(() => {
    profileRequests = 0;
    mocks.toast.mockClear();
    mocks.toast.isActive.mockClear();

    server.use(
      rest.get(apiHandlerRoute(ApiTargets.ORCID_PROFILE), (_req, res, ctx) => {
        profileRequests += 1;
        return res(ctx.status(500), ctx.json({ error: 'boom' }));
      }),
    );
  });

  test('remounting after a failed profile fetch neither refetches nor re-toasts', async () => {
    const queryClient = createProdQueryClient();

    const first = renderOrcid(queryClient);
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(1));
    expect(profileRequests).toBe(1);
    first.unmount();

    mocks.toast.mockClear();

    // Same client, so the failed query is still cached. This is the loop the
    // fix targets: the error replays with no new request.
    const second = renderOrcid(queryClient);
    await waitFor(() => expect(second.result.current).toBeTruthy());

    expect(profileRequests).toBe(1);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('a failed profile query is not evicted, so it cannot be refetched in a loop', async () => {
    const queryClient = createProdQueryClient();
    const removeQueries = vi.spyOn(queryClient, 'removeQueries');

    const { unmount } = renderOrcid(queryClient);
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledTimes(1));

    expect(removeQueries).not.toHaveBeenCalled();
    expect(profileRequests).toBe(1);

    unmount();
    removeQueries.mockRestore();
  });
});
