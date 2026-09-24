import { describe, expect, test, TestContext, vi } from 'vitest';
import { render, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@chakra-ui/react';
import { ReactNode } from 'react';

import { createStore, StoreProvider } from '@/store';
import { createServerListenerMocks, urls } from '@/test-utils';
import { theme } from '@/theme';
import { useCreateQueryClient } from '@/lib/useCreateQueryClient';
import { ApiTargets } from '@/api/models';
import { LibrariesLandingPane } from '../LibrariesLandingPane';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: {},
    asPath: '/user/libraries',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

// @/test-utils's render() zeroes staleTime/cacheTime and defaults
// refetchOnMount to true, which would hide the options under test.
const renderWithProdClient = (queryClient: QueryClient) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider createStore={() => createStore({})}>{children}</StoreProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );

  return render(<LibrariesLandingPane />, { wrapper });
};

const libraryRequests = (onRequest: Parameters<typeof urls>[0]) =>
  urls(onRequest).filter((url) => url === ApiTargets.LIBRARIES);

describe('LibrariesLandingPane', () => {
  test('refetches the library list when revisited with cached data', async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    const { result } = renderHook(() => useCreateQueryClient());
    const queryClient = result.current;

    const first = renderWithProdClient(queryClient);
    await first.findByRole('table');
    await waitFor(() => expect(libraryRequests(onRequest)).toHaveLength(1));
    first.unmount();

    const second = renderWithProdClient(queryClient);

    await waitFor(() => expect(libraryRequests(onRequest)).toHaveLength(2));
    second.unmount();
  });

  test('paints cached rows immediately on revisit rather than a skeleton', async ({ server }: TestContext) => {
    createServerListenerMocks(server);
    const { result } = renderHook(() => useCreateQueryClient());
    const queryClient = result.current;

    const first = renderWithProdClient(queryClient);
    await first.findByRole('table');
    first.unmount();

    const second = renderWithProdClient(queryClient);

    // No await: fails if revisit shows a loading skeleton instead of cache
    expect(second.queryByRole('table')).not.toBeNull();
    second.unmount();
  });
});
