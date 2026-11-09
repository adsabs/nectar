import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import { IDocsEntity } from '@/api/search/types';
import { PERF_SPANS } from '@/lib/performance';

interface RecordedSpan {
  name: string;
  ended: boolean;
  attributes: Record<string, unknown>;
}

const { spans } = vi.hoisted(() => ({ spans: [] as RecordedSpan[] }));

vi.mock('@sentry/nextjs', () => ({
  startInactiveSpan: ({ name }: { name: string }) => {
    const span: RecordedSpan = { name, ended: false, attributes: {} };
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
  },
  startSpan: (_options: unknown, callback: () => unknown): unknown => callback(),
  setTag: vi.fn(),
}));

import { useResultsRenderSpan } from './useRenderSpan';

const docsFor = (count: number): IDocsEntity[] =>
  Array.from({ length: count }, (_, i) => ({ bibcode: `bib-${i}` } as IDocsEntity));

const opened = (name: string) => spans.filter((span) => span.name === name).length;
const closed = (name: string) => spans.filter((span) => span.name === name && span.ended).length;

interface HookProps {
  docs: IDocsEntity[];
  resultSetKey: string;
  enabled?: boolean;
  totalCount?: number;
}

const renderSpanHook = (initialProps: HookProps) =>
  renderHook(
    ({ docs, resultSetKey, enabled = true, totalCount }: HookProps) =>
      useResultsRenderSpan({ docs, enabled, resultSetKey, totalCount }),
    { initialProps },
  );

const docCountOf = (name: string) => spans.find((span) => span.name === name)?.attributes.doc_count;

beforeEach(() => {
  spans.length = 0;
});

test('a progressively filled list emits one render span pair, not one per chunk', async () => {
  const { rerender } = renderSpanHook({ docs: docsFor(25), resultSetKey: 'query-a', totalCount: 500 });

  rerender({ docs: docsFor(50), resultSetKey: 'query-a', totalCount: 500 });
  rerender({ docs: docsFor(75), resultSetKey: 'query-a', totalCount: 500 });
  rerender({ docs: docsFor(100), resultSetKey: 'query-a', totalCount: 500 });

  await waitFor(() => expect(closed(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(1));

  expect(opened(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(1);
  expect(opened(PERF_SPANS.SEARCH_FACETS_RENDER)).toBe(1);
});

test('doc_count reports the whole page, not however much was revealed at first paint', async () => {
  const { rerender } = renderSpanHook({ docs: docsFor(25), resultSetKey: 'query-a', totalCount: 500 });

  rerender({ docs: docsFor(50), resultSetKey: 'query-a', totalCount: 500 });

  await waitFor(() => expect(closed(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(1));

  expect(docCountOf(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(500);
});

test('a list that reports no total falls back to the rows it was given', async () => {
  renderSpanHook({ docs: docsFor(17), resultSetKey: 'query-a' });

  await waitFor(() => expect(closed(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(1));

  expect(docCountOf(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(17);
});

test('a new result set opens a fresh render span pair', async () => {
  const { rerender } = renderSpanHook({ docs: docsFor(25), resultSetKey: 'query-a' });

  await waitFor(() => expect(closed(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(1));

  expect(spans.find((span) => span.name === PERF_SPANS.SEARCH_RESULTS_RENDER)?.attributes.doc_count).toBe(25);

  rerender({ docs: docsFor(25), resultSetKey: 'query-b' });

  await waitFor(() => expect(closed(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(2));
  expect(opened(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(2);
});

test('a list that has not opted in emits nothing', async () => {
  const { rerender } = renderSpanHook({ docs: docsFor(25), resultSetKey: 'query-a', enabled: false });

  rerender({ docs: docsFor(50), resultSetKey: 'query-a', enabled: false });
  await new Promise((resolve) => setTimeout(resolve, 50));

  expect(opened(PERF_SPANS.SEARCH_RESULTS_RENDER)).toBe(0);
  expect(opened(PERF_SPANS.SEARCH_FACETS_RENDER)).toBe(0);
});
