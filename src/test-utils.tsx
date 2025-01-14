import { AppState, StoreProvider, useCreateStore } from '@/store';
import { render, renderHook, RenderOptions } from '@testing-library/react';
import { MockedRequest } from 'msw';
import { ServerLifecycleEventsMap, SetupServerApi } from 'msw/node';
import { AnyFunction, map, path, pipe } from 'ramda';
import { ReactElement, ReactNode } from 'react';
import { Mock, vi } from 'vitest';
import { Container, ThemeProvider } from '@chakra-ui/react';
import { isObject } from 'ramda-adjunct';
import mockOrcidUser from '@/mocks/responses/orcid/exchangeOAuthCode.json';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MathJaxProvider } from '@/mathjax';
import { GoogleTagManager } from '@next/third-parties/google';
import { theme } from '@/theme';

/**
 * Attach listeners and return the mocks
 */
export const createServerListenerMocks = (server: SetupServerApi) => {

// Extract the `on` method type
  type ServerEventOnMethod = typeof server.events.on;

// Extract listener type for a specific event
  type EventListener<T extends keyof ServerLifecycleEventsMap> =
    ServerEventOnMethod extends (event: T, listener: infer U) => void ? U : never;

// Extract the parameters of the listener
  type EventMockParams<T extends keyof ServerLifecycleEventsMap> =
    Parameters<EventListener<T>>;

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
  server.events.on('request:unhandled', onUnhandled);
  server.events.on('request:end', onRequestEnd);
  server.events.on('response:bypass', onResponseBypass);
  server.events.on('unhandledException', onUnhandleException);

  return { onRequest, onResponse, onMatch, onUnhandled, onRequestEnd, onResponseBypass, onUnhandleException };
};

export const urls = pipe<[Mock], MockedRequest[], string[]>(
  path(['mock', 'calls']),
  map(path(['0', 'url', 'pathname'])),
);

interface IProviderOptions {
  initialStore?: Partial<AppState>;
  storePreset?: 'orcid-authenticated';
}

export const DefaultProviders = ({ children, options }: { children: ReactElement | ReactNode, options: IProviderOptions }) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0, staleTime: 0 },  } });

  const store = isObject(options?.initialStore) ?
    options.initialStore :
    options?.storePreset ? getStateFromPreset(options.storePreset) : {};

  return (
    <ThemeProvider theme={theme}>
      <MathJaxProvider>
        <QueryClientProvider client={queryClient}>
          <StoreProvider createStore={useCreateStore(store)}>
            <Container maxW='container.lg'>
              {children}
              <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
            </Container>
          </StoreProvider>
        </QueryClientProvider>
      </MathJaxProvider>
    </ThemeProvider>
  );
};

const getStateFromPreset = (preset: IProviderOptions['storePreset']): Partial<AppState> => {
  switch (preset) {
    case 'orcid-authenticated':
      return {
        orcid: {
          active: true,
          isAuthenticated: true,
          user: mockOrcidUser,
        },
      };
  }
};

const renderComponent = (ui: ReactElement, providerOptions?: IProviderOptions, options?: Omit<RenderOptions, 'wrapper'>) => {
  const result = render(ui, {
    wrapper: ({ children }) => <DefaultProviders options={providerOptions}>{children}</DefaultProviders>,
    ...options,
  });
  const user = userEvent.setup();
  return { user, ...result };
};

const renderHookComponent = <T extends AnyFunction, TResult = ReturnType<T>, TProps = Parameters<T>>(hook: Parameters<typeof renderHook<TResult, TProps>>[0], providerOptions?: IProviderOptions, options?: Omit<Parameters<typeof renderHook<TResult, TProps>>[1] , 'wrapper'>) => {
  return renderHook<TResult, TProps>(hook, {
   wrapper: ({ children }) => <DefaultProviders options={providerOptions}>{children}</DefaultProviders>,
   ...options
 })
}

export * from '@testing-library/react';
export { renderComponent as render };
export { renderHookComponent as renderHook}
