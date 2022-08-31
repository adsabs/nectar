import { IsomorphicResponse } from '@mswjs/interceptors';
import { StoreProvider, useCreateStore } from '@store';
import { render, RenderOptions } from '@testing-library/react';
import { DefaultRequestBody, MockedRequest } from 'msw';
import { SetupServerApi } from 'msw/node';
import { map, path, pipe } from 'ramda';
import { FC, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Mock, vi } from 'vitest';

/**
 * Attach listeners and return the mocks
 */
export const createServerListenerMocks = (server: SetupServerApi) => {
  const onRequest = vi.fn<[MockedRequest<DefaultRequestBody>], void>();
  const onResponse = vi.fn<[IsomorphicResponse, string], void>();

  server.events.on('request:start', onRequest);
  server.events.on('response:mocked', onResponse);

  return { onRequest, onResponse };
};

export const urls = pipe<[Mock], MockedRequest[], string[]>(
  path(['mock', 'calls']),
  map(path(['0', 'url', 'pathname'])),
);

export const DefaultProviders: FC = ({ children }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider createStore={useCreateStore({})}>{children}</StoreProvider>
    </QueryClientProvider>
  );
};

const renderComponent = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: DefaultProviders, ...options });

export * from '@testing-library/react';
export { renderComponent as render };
