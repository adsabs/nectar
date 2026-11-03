import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { NextRouter } from 'next/router';

import { AbsRecordBoundary } from './AbsRecordBoundary';
import { useAbsRecordState } from '@/lib/abs/useAbsRecordState';
import { AbsSSRResult } from '@/lib/abs/absRecordState';
import { IDocsEntity } from '@/api/search/types';

type QueryResult = {
  data?: { docs: IDocsEntity[]; numFound?: number };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

let queryResult: QueryResult | null = null;
const setQuery = (next: QueryResult) => {
  queryResult = next;
};

vi.mock('@/api/search/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search/search')>();
  return {
    ...actual,
    useGetAbstract: (...args: Parameters<typeof actual.useGetAbstract>) =>
      queryResult ?? actual.useGetAbstract(...args),
  };
});

let mockRouter: NextRouter;
vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

const createMockRouter = (query: NextRouter['query'] = {}): NextRouter =>
  ({
    pathname: '/abs/[id]/abstract',
    route: '/abs/[id]/abstract',
    asPath: '/abs/BIB/abstract',
    query,
    isReady: true,
    push: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue(true),
    prefetch: vi.fn().mockResolvedValue(undefined),
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  } as unknown as NextRouter);

const captureMessage = vi.fn();
vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

vi.mock('@/components/Layout/AbsLayout', () => ({
  AbsLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/components/RecordNotFound', () => ({
  RecordNotFound: () => <div data-testid="record-not-found" />,
}));
vi.mock('@/components/ServiceUnavailable', () => ({
  ServiceUnavailable: ({ statusCode }: { statusCode?: number }) => (
    <div data-testid="service-unavailable">{statusCode}</div>
  ),
}));
vi.mock('./AbsRecordSkeleton', () => ({
  AbsRecordSkeleton: () => <div data-testid="abs-record-skeleton" />,
}));

const doc = { bibcode: '2024ApJ...1..1X' } as IDocsEntity;

const Harness = ({
  ssr,
  initialDoc = null,
  queryId = 'BIB',
}: {
  ssr?: AbsSSRResult;
  initialDoc?: IDocsEntity | null;
  queryId?: string;
}) => {
  const { state } = useAbsRecordState({ ssr, queryId, initialDoc });
  return (
    <AbsRecordBoundary state={state} recordId={queryId} label="Abstract" titleDescription="">
      {(d) => <div data-testid="content">{d.bibcode}</div>}
    </AbsRecordBoundary>
  );
};

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

const withQueryClient = (client: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };

beforeEach(() => {
  mockRouter = createMockRouter({ id: 'BIB' });
});

afterEach(() => {
  captureMessage.mockReset();
  queryResult = null;
});

describe('AbsRecordBoundary + useAbsRecordState', () => {
  const renderHarness = (ui: Parameters<typeof render>[0]) =>
    render(ui, { wrapper: withQueryClient(createProdQueryClient()) });

  test('found record renders content immediately with no not-found flash', () => {
    setQuery({ data: { docs: [doc] }, isLoading: false, isFetching: false, isError: false });
    renderHarness(<Harness ssr={{ outcome: 'found' }} initialDoc={doc} />);

    expect(screen.getByTestId('content')).toHaveTextContent('2024ApJ...1..1X');
    expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
    expect(screen.queryByTestId('abs-record-skeleton')).not.toBeInTheDocument();
  });

  test('ambiguous found (still loading, no doc) shows the skeleton, never not-found', () => {
    setQuery({ data: undefined, isLoading: true, isFetching: true, isError: false });
    renderHarness(<Harness ssr={{ outcome: 'found' }} />);

    expect(screen.getByTestId('abs-record-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
  });

  test('genuine not-found (client-confirmed empty) renders RecordNotFound', () => {
    setQuery({ data: { docs: [] }, isLoading: false, isFetching: false, isError: false });
    renderHarness(<Harness ssr={{ outcome: 'not-found' }} />);

    expect(screen.getByTestId('record-not-found')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('persistent error shows ServiceUnavailable with the SSR status code', () => {
    setQuery({ data: undefined, isLoading: false, isFetching: false, isError: true });
    renderHarness(<Harness ssr={{ outcome: 'error', statusCode: 502, reason: 'fetch-not-ok' }} />);

    expect(screen.getByTestId('service-unavailable')).toHaveTextContent('502');
    expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
  });

  test('transient error then recover: skeleton first, then content, and reports the recovery', () => {
    setQuery({ data: undefined, isLoading: true, isFetching: true, isError: false });
    const { rerender } = renderHarness(<Harness ssr={{ outcome: 'error', statusCode: 503, reason: 'fetch-not-ok' }} />);
    expect(screen.getByTestId('abs-record-skeleton')).toBeInTheDocument();

    setQuery({ data: { docs: [doc] }, isLoading: false, isFetching: false, isError: false });
    rerender(<Harness ssr={{ outcome: 'error', statusCode: 503, reason: 'fetch-not-ok' }} />);

    expect(screen.getByTestId('content')).toHaveTextContent('2024ApJ...1..1X');
    expect(captureMessage).toHaveBeenCalledWith(
      'abs_ssr_false_negative_recovered',
      expect.objectContaining({ level: 'warning' }),
    );
  });

  test('reports recovery again after client-side navigation to a different record', () => {
    setQuery({ data: { docs: [doc] }, isLoading: false, isFetching: false, isError: false });
    const err = { outcome: 'error', statusCode: 503, reason: 'fetch-not-ok' } as const;
    const { rerender } = renderHarness(<Harness ssr={err} queryId="BIB-A" />);
    expect(captureMessage).toHaveBeenCalledTimes(1);

    // Same sub-view, different record — the page does not remount; the recovery
    // signal must still fire for the new queryId.
    rerender(<Harness ssr={err} queryId="BIB-B" />);
    expect(captureMessage).toHaveBeenCalledTimes(2);
  });

  describe('missing SSR props, driven by a real QueryClient', () => {
    test('with no recoverable id the skeleton never renders and the page is terminal', async () => {
      mockRouter = createMockRouter({});
      renderHarness(<Harness ssr={undefined} queryId="" />);

      expect(await screen.findByTestId('service-unavailable')).toHaveTextContent('500');
      expect(screen.queryByTestId('abs-record-skeleton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
    });

    test('with a router id the skeleton is transient and resolves to content', async () => {
      mockRouter = createMockRouter({ id: '2021ApJ...123..456A' });
      renderHarness(<Harness ssr={undefined} queryId="" />);

      expect(screen.getByTestId('abs-record-skeleton')).toBeInTheDocument();

      await waitFor(() => expect(screen.getByTestId('content')).toBeInTheDocument(), { timeout: 4_000 });
      expect(screen.queryByTestId('abs-record-skeleton')).not.toBeInTheDocument();
    });
  });
});
