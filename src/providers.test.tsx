import { render, waitFor } from '@/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { IADSApiSearchParams } from '@/api/search/types';
import { AppState, useStore } from '@/store';
import { PERF_SPANS } from '@/lib/performance';

interface RecordedSpan {
  name: string;
  attributes: Record<string, unknown>;
  ended: boolean;
}

const { spans } = vi.hoisted(() => ({ spans: [] as RecordedSpan[] }));

vi.mock('@sentry/nextjs', () => {
  const startInactiveSpan = ({ name, attributes }: { name: string; attributes?: Record<string, unknown> }) => {
    const span: RecordedSpan = { name, attributes: { ...attributes }, ended: false };
    spans.push(span);
    return {
      setAttributes: (attrs: Record<string, unknown>): void => {
        Object.assign(span.attributes, attrs);
      },
      setStatus: (): void => undefined,
      end: (): void => {
        span.ended = true;
      },
    };
  };

  return {
    startInactiveSpan,
    startSpan: (_options: unknown, callback: () => unknown): unknown => callback(),
    setTag: vi.fn(),
  };
});

vi.mock('@/lib/useGlobalErrorHandler', () => ({ useGlobalErrorHandler: (): void => undefined }));
vi.mock('@/lib/useTrackUserId', () => ({ useTrackUserId: (): void => undefined }));
vi.mock('@/lib/orcid/useOrcid', () => ({ useOrcidExpiryWatcher: (): void => undefined }));

import { Telemetry } from './providers';

const storeWith = ({ rows, docCount }: { rows: number; docCount: number }): Partial<AppState> => ({
  latestQuery: { q: 'star', sort: ['date desc'], start: 0, rows } as IADSApiSearchParams,
  docs: {
    doc: null,
    current: Array.from({ length: docCount }, (_, i) => `bib-${i}`),
    selected: [],
    isAllSelected: false,
    isSomeSelected: false,
  },
});

const submitSpan = () => spans.find((span) => span.name === PERF_SPANS.SEARCH_SUBMIT_TOTAL);
const fullTextSpanCount = () => spans.filter((span) => span.name === PERF_SPANS.UX_FULL_TEXT_TIME).length;

const FillHarness = () => {
  const setDocs = useStore((state) => state.setDocs);
  return (
    <button type="button" onClick={() => setDocs(Array.from({ length: 500 }, (_, i) => `bib-${i}`))}>
      land the fill
    </button>
  );
};

beforeEach(() => {
  spans.length = 0;
});

test('a large page buckets by the requested page size, not the rows painted so far', async () => {
  render(<Telemetry />, { initialStore: storeWith({ rows: 500, docCount: 100 }) });

  await waitFor(() => expect(submitSpan()?.ended).toBe(true));

  expect(submitSpan()?.attributes).toHaveProperty('result_count_bucket');
  expect(submitSpan()?.attributes.result_count_bucket).toBe('100+');
});

test('a narrow result set on a large page buckets by what actually came back', async () => {
  render(<Telemetry />, { initialStore: storeWith({ rows: 500, docCount: 7 }) });

  await waitFor(() => expect(submitSpan()?.ended).toBe(true));

  expect(submitSpan()?.attributes.result_count_bucket).toBe('1-10');
});

test('the full-text timing span is opened once per search, not again when the fill lands', async () => {
  const { user, getByRole } = render(
    <>
      <Telemetry />
      <FillHarness />
    </>,
    { initialStore: storeWith({ rows: 500, docCount: 25 }) },
  );

  await waitFor(() => expect(submitSpan()?.ended).toBe(true));
  expect(fullTextSpanCount()).toBe(1);

  await user.click(getByRole('button', { name: 'land the fill' }));

  await waitFor(() => expect(submitSpan()?.ended).toBe(true));
  expect(fullTextSpanCount()).toBe(1);
});

test('a small page still buckets by its own size', async () => {
  render(<Telemetry />, { initialStore: storeWith({ rows: 10, docCount: 10 }) });

  await waitFor(() => expect(submitSpan()?.ended).toBe(true));

  expect(submitSpan()?.attributes.result_count_bucket).toBe('1-10');
});
