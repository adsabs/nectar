import { StoreProvider, useCreateStore } from '@store';
import { render, RenderOptions } from '@testing-library/react';
import { MockedRequest } from 'msw';
import { ServerLifecycleEventsMap, SetupServerApi } from 'msw/node';
import { map, path, pipe } from 'ramda';
import { FC, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Mock, vi } from 'vitest';

/**
 * Attach listeners and return the mocks
 */
export const createServerListenerMocks = (server: SetupServerApi) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type EventMockParams<T extends keyof ServerLifecycleEventsMap> =
    Parameters<Parameters<typeof server.events.on<T>>[1]>;

  const onRequest = vi.fn<EventMockParams<'request:start'>, void>();
  const onMatch = vi.fn<EventMockParams<'request:match'>, void>();
  const onResponse = vi.fn<EventMockParams<'response:mocked'>, void>();
  const onUnhandled = vi.fn<EventMockParams<'request:unhandled'>, void>();
  const onRequestEnd = vi.fn<EventMockParams<'request:end'>, void>();
  const onResponseBypass = vi.fn<EventMockParams<'response:bypass'>, void>();
  const onUnhandleException = vi.fn<EventMockParams<'unhandledException'>, void>();

  server.events.on('request:start', onRequest);
  server.events.on('response:mocked', onResponse);
  server.events.on('request:match', onMatch);
  server.events.on('request:unhandled', onUnhandled)
  server.events.on('request:end', onRequestEnd);
  server.events.on('response:bypass', onResponseBypass);
  server.events.on('unhandledException', onUnhandleException);

  return { onRequest, onResponse, onMatch, onUnhandled, onRequestEnd, onResponseBypass, onUnhandleException };
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

