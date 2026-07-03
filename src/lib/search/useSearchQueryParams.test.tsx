import { describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { OnUrlUpdateFunction, withNuqsTestingAdapter } from 'nuqs/adapters/testing';
import { DefaultProviders } from '@/test-utils';
import { useSearchQueryParams } from './useSearchQueryParams';

// keep the next/router mock's query in sync with the nuqs adapter's searchParams
// per test — the hook reads declared keys through nuqs and passthrough keys from
// router.query
const router = {
  isReady: true,
  pathname: '/search',
  asPath: '/search',
  query: {} as Record<string, string | string[]>,
  push: vi.fn(),
  replace: vi.fn(),
  events: { on: vi.fn(), off: vi.fn() },
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const makeWrapper = (
  searchParams: string,
  query: Record<string, string | string[]> = {},
  options: { onUrlUpdate?: OnUrlUpdateFunction; keepMountUpdates?: boolean } = {},
) => {
  router.query = query;
  router.asPath = `/search${searchParams}`;
  // hasMemory makes the adapter apply URL updates like a real browser —
  // required for round-trip assertions now that the hook writes on mount.
  // keepMountUpdates disables the adapter's mount-time queue reset, which
  // would abort the hook's own mount-time sort/rows stamp (the real pages
  // adapter has no such reset); it stays on elsewhere for test isolation.
  const NuqsWrapper = withNuqsTestingAdapter({
    searchParams,
    onUrlUpdate: options.onUrlUpdate,
    hasMemory: true,
    resetUrlUpdateQueueOnMount: !options.keepMountUpdates,
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <NuqsWrapper>
      <DefaultProviders options={{}}>{children}</DefaultProviders>
    </NuqsWrapper>
  );
  Wrapper.displayName = 'SearchQueryParamsTestWrapper';
  return Wrapper;
};

describe('useSearchQueryParams', () => {
  test('returns canonical defaults when the URL has no params', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper(''),
    });
    expect(result.current.params.q).toBe('*:*');
    expect(result.current.params.p).toBe(1);
    expect(result.current.params.rows).toBe(10);
    expect(result.current.params.sort).toEqual(['score desc', 'date desc']);
    expect(result.current.params).not.toHaveProperty('fq');
    expect(result.current.showHighlights).toBe(false);
  });

  test('parses q, p, and repeated fq/sort params from the URL', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?q=star+formation&p=3&fq=year%3A2020&fq=bibstem%3AApJ&sort=date+desc'),
    });
    expect(result.current.params.q).toBe('star formation');
    expect(result.current.params.p).toBe(3);
    expect(result.current.params.fq).toEqual(['year:2020', 'bibstem:ApJ']);
    expect(result.current.params.sort).toEqual(['date desc']);
  });

  test('passes facet companion params through from router.query', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?q=star&fq=%7B!type%3Daqp%20v%3D%24fq_author%7D&fq_author=author%3A%22Smith%2C%20J%22', {
        q: 'star',
        fq: '{!type=aqp v=$fq_author}',
        fq_author: 'author:"Smith, J"',
      }),
    });
    expect(result.current.params.fq_author).toBe('author:"Smith, J"');
  });

  test('setParams round-trips values and resets are visible', async () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?q=stars&p=3'),
    });
    await act(async () => {
      await result.current.setParams({ q: 'galaxies', p: 1 });
    });
    expect(result.current.params.q).toBe('galaxies');
    expect(result.current.params.p).toBe(1);
  });

  test('setParams serializes sort and fq arrays as repeated params', async () => {
    const onUrlUpdate = vi.fn();
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?', {}, { onUrlUpdate }),
    });
    await act(async () => {
      await result.current.setParams({
        sort: ['score desc', 'date desc'],
        fq: ['author:"Smith, J"', 'year:2020'],
      });
    });
    // the mount-time sort/rows stamp may have fired first — assert the last update
    const call = onUrlUpdate.mock.calls.at(-1)[0] as { searchParams: URLSearchParams };
    expect(call.searchParams.getAll('sort')).toEqual(['score desc', 'date desc']);
    expect(call.searchParams.getAll('fq')).toEqual(['author:"Smith, J"', 'year:2020']);
  });

  test('showHighlights parses from the URL and defaults to false', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?q=star&showHighlights=true'),
    });
    expect(result.current.showHighlights).toBe(true);
  });

  test('invalid rows falls back to the store preference', () => {
    const { result } = renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?q=star&rows=13'),
    });
    // store default numPerPage is 10 (APP_DEFAULTS.RESULT_PER_PAGE)
    expect(result.current.params.rows).toBe(10);
  });

  test('stamps resolved sort and rows into the URL when absent (history: replace)', async () => {
    const onUrlUpdate = vi.fn();
    renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?q=star', {}, { onUrlUpdate, keepMountUpdates: true }),
    });
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const call = onUrlUpdate.mock.calls[0][0] as {
      searchParams: URLSearchParams;
      options: { history: string };
    };
    expect(call.searchParams.getAll('sort')).toEqual(['score desc', 'date desc']);
    expect(call.searchParams.get('rows')).toBe('10');
    expect(call.searchParams.get('q')).toBe('star');
    expect(call.options.history).toBe('replace');
  });

  test('does not rewrite the URL when sort and rows are already present', async () => {
    const onUrlUpdate = vi.fn();
    renderHook(() => useSearchQueryParams(), {
      wrapper: makeWrapper('?q=star&sort=date+desc&rows=25', {}, { onUrlUpdate, keepMountUpdates: true }),
    });
    // give the stamp effect a chance to (incorrectly) fire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(onUrlUpdate).not.toHaveBeenCalled();
  });
});
