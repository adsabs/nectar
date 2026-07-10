import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AbsRecordBoundary } from './AbsRecordBoundary';
import { useAbsRecordState } from '@/lib/abs/useAbsRecordState';
import { AbsSSRResult } from '@/lib/abs/absRecordState';
import { IDocsEntity } from '@/api/search/types';

// Controllable stand-in for the client abstract query. Each test sets the value
// the hook observes, simulating hydrated cache / loading / error / empty outcomes.
type QueryResult = {
  data?: { docs: IDocsEntity[]; numFound?: number };
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
};

let queryResult: QueryResult = { data: undefined, isLoading: false, isFetching: false, isError: false };
const setQuery = (next: QueryResult) => {
  queryResult = next;
};

vi.mock('@/api/search/search', () => ({
  useGetAbstract: () => queryResult,
}));

const captureMessage = vi.fn();
vi.mock('@sentry/nextjs', () => ({
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

afterEach(() => {
  captureMessage.mockReset();
  setQuery({ data: undefined, isLoading: false, isFetching: false, isError: false });
});

describe('AbsRecordBoundary + useAbsRecordState', () => {
  test('found record renders content immediately with no not-found flash', () => {
    setQuery({ data: { docs: [doc] }, isLoading: false, isFetching: false, isError: false });
    render(<Harness ssr={{ outcome: 'found' }} initialDoc={doc} />);

    expect(screen.getByTestId('content')).toHaveTextContent('2024ApJ...1..1X');
    expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
    expect(screen.queryByTestId('abs-record-skeleton')).not.toBeInTheDocument();
  });

  test('ambiguous found (still loading, no doc) shows the skeleton, never not-found', () => {
    setQuery({ data: undefined, isLoading: true, isFetching: true, isError: false });
    render(<Harness ssr={{ outcome: 'found' }} />);

    expect(screen.getByTestId('abs-record-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
  });

  test('genuine not-found (client-confirmed empty) renders RecordNotFound', () => {
    setQuery({ data: { docs: [] }, isLoading: false, isFetching: false, isError: false });
    render(<Harness ssr={{ outcome: 'not-found' }} />);

    expect(screen.getByTestId('record-not-found')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('persistent error shows ServiceUnavailable with the SSR status code', () => {
    setQuery({ data: undefined, isLoading: false, isFetching: false, isError: true });
    render(<Harness ssr={{ outcome: 'error', statusCode: 502, reason: 'fetch-not-ok' }} />);

    expect(screen.getByTestId('service-unavailable')).toHaveTextContent('502');
    expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
  });

  test('transient error then recover: skeleton first, then content, and reports the recovery', () => {
    setQuery({ data: undefined, isLoading: true, isFetching: true, isError: false });
    const { rerender } = render(<Harness ssr={{ outcome: 'error', statusCode: 503, reason: 'fetch-not-ok' }} />);
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
    const { rerender } = render(<Harness ssr={err} queryId="BIB-A" />);
    expect(captureMessage).toHaveBeenCalledTimes(1);

    // Same sub-view, different record — the page does not remount; the recovery
    // signal must still fire for the new queryId.
    rerender(<Harness ssr={err} queryId="BIB-B" />);
    expect(captureMessage).toHaveBeenCalledTimes(2);
  });

  test('missing ssr props degrade to an error state instead of crashing', () => {
    setQuery({ data: undefined, isLoading: false, isFetching: false, isError: false });
    render(<Harness ssr={undefined} queryId="" />);

    expect(screen.getByTestId('service-unavailable')).toHaveTextContent('500');
    expect(screen.queryByTestId('record-not-found')).not.toBeInTheDocument();
  });
});
