import { createServerListenerMocks, render, screen, waitFor } from '@/test-utils';
import { renderHook as renderHookRaw } from '@testing-library/react';
import { expect, test } from 'vitest';
import type { TestContext } from 'vitest';
import { rest } from 'msw';
import { ReactElement, useLayoutEffect } from 'react';
import { ApiTargets } from '@/api/models';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import { PRIMER_ROWS } from '@/config';
import { REVEAL_CHUNK_SIZE, useChunkedReveal, useProgressiveSearch } from './useProgressiveSearch';

const TOTAL = 760602;

const docsFor = (rows: number, start: number) =>
  Array.from({ length: rows }, (_, i) => ({ bibcode: `bib-${start + i}`, title: [`Title ${start + i}`] }));

const stubSearch = (server: TestContext['server'], failRows?: number, delay?: { rows: number; ms: number }) =>
  server.use(
    rest.get(apiHandlerRoute(ApiTargets.SEARCH), (req, res, ctx) => {
      const rows = parseInt(req.url.searchParams.get('rows') ?? '10', 10);
      const start = parseInt(req.url.searchParams.get('start') ?? '0', 10);
      if (failRows !== undefined && rows === failRows) {
        return res(ctx.status(500), ctx.json({ error: 'boom' }));
      }
      if (delay !== undefined && rows === delay.rows) {
        return res(
          ctx.status(200),
          ctx.delay(delay.ms),
          ctx.json<IADSApiSearchResponse>({
            responseHeader: { status: 0, QTime: 1, params: { q: 'star' } },
            response: { numFound: TOTAL, docs: docsFor(rows, start) },
          }),
        );
      }
      return res(
        ctx.status(200),
        ctx.json<IADSApiSearchResponse>({
          responseHeader: { status: 0, QTime: 1, params: { q: 'star' } },
          response: { numFound: TOTAL, docs: docsFor(rows, start) },
        }),
      );
    }),
  );

const stubFixedResultSet = (server: TestContext['server'], count: number) =>
  server.use(
    rest.get(apiHandlerRoute(ApiTargets.SEARCH), (_req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.json<IADSApiSearchResponse>({
          responseHeader: { status: 0, QTime: 1, params: { q: 'star' } },
          response: { numFound: count, docs: docsFor(count, 0) },
        }),
      ),
    ),
  );

const searchRowsRequested = (onRequest: { mock: { calls: { 0: { url: URL } }[] } }) =>
  onRequest.mock.calls
    .map((call) => call[0].url)
    .filter((url) => url.pathname.endsWith('/search/query'))
    .map((url) => Number(url.searchParams.get('rows')));

const baseParams = (rows: number): IADSApiSearchParams => ({
  q: 'star',
  sort: ['date desc'],
  start: 0,
  rows,
});

const Probe = ({
  rows,
  revealed,
  fl,
  loaded,
}: {
  rows: number;
  revealed: number[];
  fl?: string[];
  loaded?: boolean[];
}): ReactElement => {
  const { docs, data, isError, isFillError, isFullSetLoaded, pageRowCount } = useProgressiveSearch({
    ...baseParams(rows),
    ...(fl ? { fl } : {}),
  });
  revealed.push(docs.length);
  loaded?.push(isFullSetLoaded);

  return (
    <>
      <span data-testid="revealed">{docs.length}</span>
      <span data-testid="pageRowCount">{pageRowCount}</span>
      <span data-testid="numFound">{data?.response?.numFound ?? -1}</span>
      <span data-testid="isError">{String(isError)}</span>
      <span data-testid="isFillError">{String(isFillError)}</span>
      <span data-testid="isFullSetLoaded">{String(isFullSetLoaded)}</span>
    </>
  );
};

const increments = (seq: number[]) => {
  const distinct = seq.filter((n, i) => i === 0 || n !== seq[i - 1]);
  return distinct.slice(1).map((n, i) => n - distinct[i]);
};

test('a 500-row page primes with 25 rows and then requests the full set', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  stubSearch(server);
  const revealed: number[] = [];

  render(<Probe rows={500} revealed={revealed} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).not.toHaveTextContent('0'));
  expect(searchRowsRequested(onRequest)[0]).toBe(PRIMER_ROWS);

  await waitFor(() => expect(searchRowsRequested(onRequest)).toContain(500), { timeout: 5000 });
  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('500'), { timeout: 5000 });

  expect(screen.getByTestId('numFound')).toHaveTextContent(String(TOTAL));
});

const SINGLE_FETCH_ROWS = [10, PRIMER_ROWS];
const SMALLEST_STAGED_ROWS = 50;

for (const rows of SINGLE_FETCH_ROWS) {
  test(`a ${rows}-row page issues exactly one request`, async ({ server }: TestContext) => {
    const { onRequest } = createServerListenerMocks(server);
    stubSearch(server);
    const revealed: number[] = [];

    render(<Probe rows={rows} revealed={revealed} />);

    await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(rows)));
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(searchRowsRequested(onRequest)).toEqual([rows]);
  });
}

test(`a ${SMALLEST_STAGED_ROWS}-row page still primes before requesting the full page`, async ({
  server,
}: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  stubSearch(server);
  const revealed: number[] = [];
  const loaded: boolean[] = [];

  render(<Probe rows={SMALLEST_STAGED_ROWS} revealed={revealed} loaded={loaded} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(SMALLEST_STAGED_ROWS)), {
    timeout: 10000,
  });
  await new Promise((resolve) => setTimeout(resolve, 200));

  expect(searchRowsRequested(onRequest)).toEqual([PRIMER_ROWS, SMALLEST_STAGED_ROWS]);
  expect(loaded[loaded.length - 1]).toBe(true);

  const steps = increments(revealed);
  expect(steps.length).toBeGreaterThan(1);
  expect(Math.max(...steps)).toBeLessThanOrEqual(REVEAL_CHUNK_SIZE);
});

test('rows are revealed in chunks, never all in one commit, and all of them arrive', async ({
  server,
}: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  stubSearch(server);
  const revealed: number[] = [];

  render(<Probe rows={500} revealed={revealed} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('500'), { timeout: 10000 });
  expect(searchRowsRequested(onRequest)).toContain(500);

  const steps = increments(revealed);
  expect(revealed[revealed.length - 1]).toBe(500);
  expect(steps.every((step) => step > 0)).toBe(true);
  expect(Math.max(...steps)).toBeLessThanOrEqual(REVEAL_CHUNK_SIZE);
  expect(steps.length).toBeGreaterThan(2);
});

test('toggling a field-list-only param does not unreveal the rows already shown', async ({ server }: TestContext) => {
  stubSearch(server);
  const revealed: number[] = [];

  const { rerender } = render(<Probe rows={500} revealed={revealed} fl={['bibcode', 'title']} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('500'), { timeout: 10000 });

  const settled = revealed.length;
  rerender(<Probe rows={500} revealed={revealed} fl={['bibcode', 'title', 'abstract']} />);
  await new Promise((resolve) => setTimeout(resolve, 300));

  const after = revealed.slice(settled);
  expect(after.length).toBeGreaterThan(0);
  expect(Math.min(...after)).toBe(500);
});

test('a failed fill keeps the primed rows and reports a fill error, not a page error', async ({
  server,
}: TestContext) => {
  stubSearch(server, 500);
  const revealed: number[] = [];

  render(<Probe rows={500} revealed={revealed} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(PRIMER_ROWS)));
  await waitFor(() => expect(screen.getByTestId('isFillError')).toHaveTextContent('true'), { timeout: 10000 });

  expect(Number(screen.getByTestId('revealed').textContent)).toBe(PRIMER_ROWS);
  expect(screen.getByTestId('isError')).toHaveTextContent('false');
});

test('the full set is not reported loaded while the fill request is still in flight', async ({
  server,
}: TestContext) => {
  stubSearch(server, undefined, { rows: 500, ms: 400 });
  const revealed: number[] = [];
  const loaded: boolean[] = [];

  render(<Probe rows={500} revealed={revealed} loaded={loaded} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(PRIMER_ROWS)));
  expect(screen.getByTestId('isFullSetLoaded')).toHaveTextContent('false');

  await waitFor(() => expect(screen.getByTestId('isFullSetLoaded')).toHaveTextContent('true'), { timeout: 10000 });
  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('500'), { timeout: 10000 });
  expect(loaded[loaded.length - 1]).toBe(true);
});

for (const rows of SINGLE_FETCH_ROWS) {
  test(`a ${rows}-row page reports the full set loaded straight away`, async ({ server }: TestContext) => {
    stubSearch(server);
    const revealed: number[] = [];
    const loaded: boolean[] = [];

    render(<Probe rows={rows} revealed={revealed} loaded={loaded} />);

    await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(rows)));

    expect(screen.getByTestId('isFullSetLoaded')).toHaveTextContent('true');
    expect(loaded.every((value) => value === true)).toBe(true);
  });
}

test('beforeprint flushes the remaining rows in one commit', async ({ server }: TestContext) => {
  stubSearch(server);
  const revealed: number[] = [];

  render(<Probe rows={500} revealed={revealed} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).not.toHaveTextContent('0'));
  await waitFor(() => expect(screen.getByTestId('numFound')).not.toHaveTextContent('-1'));
  const before = Number(screen.getByTestId('revealed').textContent);
  expect(before).toBeLessThan(500);

  window.dispatchEvent(new Event('beforeprint'));

  expect(Number(screen.getByTestId('revealed').textContent)).toBeGreaterThan(before);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('500'), { timeout: 10000 });
  expect(Math.max(...increments(revealed))).toBeGreaterThan(REVEAL_CHUNK_SIZE);
});

test('a result set smaller than the primer does not trigger a fill request', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  stubFixedResultSet(server, 7);
  const revealed: number[] = [];
  const loaded: boolean[] = [];

  render(<Probe rows={500} revealed={revealed} loaded={loaded} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('7'));
  await new Promise((resolve) => setTimeout(resolve, 300));

  expect(searchRowsRequested(onRequest)).toEqual([PRIMER_ROWS]);
  expect(screen.getByTestId('isFullSetLoaded')).toHaveTextContent('true');
});

test('a result set of exactly the primer size still requests the full page', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  stubFixedResultSet(server, PRIMER_ROWS);
  const revealed: number[] = [];
  const loaded: boolean[] = [];

  render(<Probe rows={500} revealed={revealed} loaded={loaded} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(PRIMER_ROWS)));
  await new Promise((resolve) => setTimeout(resolve, 300));

  expect(searchRowsRequested(onRequest)).toEqual([PRIMER_ROWS, 500]);
  expect(screen.getByTestId('isFullSetLoaded')).toHaveTextContent('true');
});

test('printing before the fill lands still reveals the filled rows in chunks', async ({ server }: TestContext) => {
  stubSearch(server, undefined, { rows: 500, ms: 300 });
  const revealed: number[] = [];

  render(<Probe rows={500} revealed={revealed} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(PRIMER_ROWS)));
  expect(screen.getByTestId('isFullSetLoaded')).toHaveTextContent('false');

  window.dispatchEvent(new Event('beforeprint'));
  const atPrint = revealed.length;

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('500'), { timeout: 10000 });

  const afterPrint = increments(revealed.slice(atPrint));
  expect(afterPrint.length).toBeGreaterThan(0);
  expect(Math.max(...afterPrint)).toBeLessThanOrEqual(REVEAL_CHUNK_SIZE);
});

const RevealProbe = ({ available, resetKey, committed }: RevealProbeProps) => {
  const revealed = useChunkedReveal(available, resetKey);
  useLayoutEffect(() => {
    committed.push(revealed);
  });
  return revealed;
};

interface RevealProbeProps {
  available: number;
  resetKey: string;
  committed: number[];
}

test('a new result set resets the reveal before any of its rows are committed', async () => {
  const committed: number[] = [];

  const { result, rerender } = renderHookRaw((props: RevealProbeProps) => RevealProbe(props), {
    initialProps: { available: PRIMER_ROWS, resetKey: 'query-a', committed },
  });

  await waitFor(() => expect(result.current).toBe(PRIMER_ROWS));

  const mark = committed.length;
  rerender({ available: PRIMER_ROWS, resetKey: 'query-b', committed });

  expect(committed.length).toBeGreaterThan(mark);
  expect(committed[mark]).toBe(0);
});

test('an already-cached result set is still revealed in chunks, not in one commit', async () => {
  const committed: number[] = [];
  const FULL = 500;

  const { result, rerender } = renderHookRaw((props: RevealProbeProps) => RevealProbe(props), {
    initialProps: { available: FULL, resetKey: 'query-a', committed },
  });

  await waitFor(() => expect(result.current).toBe(FULL), { timeout: 10000 });

  const mark = committed.length;
  rerender({ available: FULL, resetKey: 'query-b', committed });

  await waitFor(() => expect(result.current).toBe(FULL), { timeout: 10000 });

  const after = committed.slice(mark);
  const steps = increments(after);
  expect(after[0]).toBe(0);
  expect(steps.length).toBeGreaterThan(2);
  expect(Math.max(...steps)).toBeLessThanOrEqual(REVEAL_CHUNK_SIZE);
});

test('the page row count is the whole page as soon as the primer lands', async ({ server }: TestContext) => {
  stubSearch(server, undefined, { rows: 500, ms: 400 });
  const revealed: number[] = [];

  render(<Probe rows={500} revealed={revealed} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent(String(PRIMER_ROWS)));
  expect(screen.getByTestId('isFullSetLoaded')).toHaveTextContent('false');

  expect(screen.getByTestId('pageRowCount')).toHaveTextContent('500');
});

test('the page row count stops at a result set smaller than the page', async ({ server }: TestContext) => {
  stubFixedResultSet(server, 7);
  const revealed: number[] = [];

  render(<Probe rows={500} revealed={revealed} />);

  await waitFor(() => expect(screen.getByTestId('revealed')).toHaveTextContent('7'));

  expect(screen.getByTestId('pageRowCount')).toHaveTextContent('7');
});
