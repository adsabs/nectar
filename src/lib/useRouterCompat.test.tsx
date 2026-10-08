import { render } from '@testing-library/react';
import { ReactElement, useEffect } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppRouterCompatProvider, PagesRouterCompatProvider, RouterCompat, useRouterCompat } from './useRouterCompat';

type RouterEvent = 'beforeHistoryChange' | 'routeChangeComplete' | 'routeChangeError';

const mocks = vi.hoisted(() => ({
  pagesRouter: {
    current: null as unknown,
  },
  appRouter: {
    pathname: '/',
    searchParams: new URLSearchParams(),
    push: vi.fn(),
    replace: vi.fn(),
  },
}));

vi.mock('next/router', () => ({
  useRouter: () => mocks.pagesRouter.current,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.appRouter.pathname,
  useSearchParams: () => mocks.appRouter.searchParams,
  useRouter: () => ({ push: mocks.appRouter.push, replace: mocks.appRouter.replace }),
}));

// A stand-in for next/router's event emitter that also records whether each
// handler was detached, so teardown can be asserted rather than assumed.
const createEvents = () => {
  const handlers = new Map<RouterEvent, Set<() => void>>();

  return {
    on: vi.fn((event: RouterEvent, cb: () => void) => {
      const set = handlers.get(event) ?? new Set<() => void>();
      set.add(cb);
      handlers.set(event, set);
    }),
    off: vi.fn((event: RouterEvent, cb: () => void) => {
      handlers.get(event)?.delete(cb);
    }),
    emit: (event: RouterEvent) => {
      handlers.get(event)?.forEach((cb) => cb());
    },
    count: (event: RouterEvent) => handlers.get(event)?.size ?? 0,
  };
};

const createPagesRouter = (asPath: string, query: Record<string, string | string[]> = {}) => {
  const events = createEvents();
  mocks.pagesRouter.current = {
    asPath,
    pathname: '/should-not-be-read',
    query,
    push: vi.fn(),
    replace: vi.fn(),
    events,
  };
  return events;
};

type Calls = { start: number; complete: number; error: number };

const Probe = ({ calls, onRouter }: { calls: Calls; onRouter?: (r: RouterCompat) => void }): ReactElement => {
  const router = useRouterCompat();
  onRouter?.(router);

  useEffect(() => router.onNavigateStart(() => (calls.start += 1)), [router, calls]);
  useEffect(() => router.onNavigateComplete(() => (calls.complete += 1)), [router, calls]);
  useEffect(() => router.onNavigateError?.(() => (calls.error += 1)), [router, calls]);

  return <div />;
};

const freshCalls = (): Calls => ({ start: 0, complete: 0, error: 0 });

describe('PagesRouterCompatProvider', () => {
  test('maps each router event to the matching listener and never crosses them', () => {
    const events = createPagesRouter('/search?q=star');
    const calls = freshCalls();

    render(
      <PagesRouterCompatProvider>
        <Probe calls={calls} />
      </PagesRouterCompatProvider>,
    );

    events.emit('beforeHistoryChange');
    expect(calls).toEqual({ start: 1, complete: 0, error: 0 });

    events.emit('routeChangeComplete');
    expect(calls).toEqual({ start: 1, complete: 1, error: 0 });

    events.emit('routeChangeError');
    expect(calls).toEqual({ start: 1, complete: 1, error: 1 });
  });

  test('detaches every handler on unmount', () => {
    const events = createPagesRouter('/search');
    const { unmount } = render(
      <PagesRouterCompatProvider>
        <Probe calls={freshCalls()} />
      </PagesRouterCompatProvider>,
    );

    unmount();

    expect(events.count('beforeHistoryChange')).toBe(0);
    expect(events.count('routeChangeComplete')).toBe(0);
    expect(events.count('routeChangeError')).toBe(0);
  });

  // router.pathname is the route pattern, so it reports /search/[id] rather
  // than the real path. Everything here derives from asPath instead.
  test('derives pathname and searchParams from asPath', () => {
    createPagesRouter('/search?q=star&sort=date#results');
    let router: RouterCompat | null = null;

    render(
      <PagesRouterCompatProvider>
        <Probe
          calls={freshCalls()}
          onRouter={(r) => {
            router = r;
          }}
        />
      </PagesRouterCompatProvider>,
    );

    expect(router?.pathname).toBe('/search');
    expect(router?.searchParams.get('q')).toBe('star');
    expect(router?.searchParams.get('sort')).toBe('date');
  });
});

describe('AppRouterCompatProvider', () => {
  beforeEach(() => {
    mocks.appRouter.pathname = '/search';
    mocks.appRouter.searchParams = new URLSearchParams('q=star');
  });

  test('does not report a navigation on first render', () => {
    const calls = freshCalls();

    render(
      <AppRouterCompatProvider>
        <Probe calls={calls} />
      </AppRouterCompatProvider>,
    );

    expect(calls).toEqual({ start: 0, complete: 0, error: 0 });
  });

  test('fires both start and complete once the path changes', () => {
    const calls = freshCalls();
    const { rerender } = render(
      <AppRouterCompatProvider>
        <Probe calls={calls} />
      </AppRouterCompatProvider>,
    );

    mocks.appRouter.pathname = '/abs/123';
    rerender(
      <AppRouterCompatProvider>
        <Probe calls={calls} />
      </AppRouterCompatProvider>,
    );

    expect(calls.start).toBe(1);
    expect(calls.complete).toBe(1);
  });

  test('fires on a search-param-only change', () => {
    const calls = freshCalls();
    const { rerender } = render(
      <AppRouterCompatProvider>
        <Probe calls={calls} />
      </AppRouterCompatProvider>,
    );

    mocks.appRouter.searchParams = new URLSearchParams('q=star&p=2');
    rerender(
      <AppRouterCompatProvider>
        <Probe calls={calls} />
      </AppRouterCompatProvider>,
    );

    expect(calls.complete).toBe(1);
  });

  // Pages Router can report a failed navigation; App Router has no equivalent,
  // so the capability is absent rather than a no-op that silently never fires.
  test('exposes no onNavigateError', () => {
    let router: RouterCompat | null = null;

    render(
      <AppRouterCompatProvider>
        <Probe
          calls={freshCalls()}
          onRouter={(r) => {
            router = r;
          }}
        />
      </AppRouterCompatProvider>,
    );

    expect(router?.onNavigateError).toBeUndefined();
  });

  test('builds query and asPath from the live search params', () => {
    mocks.appRouter.searchParams = new URLSearchParams('q=star&fq=a&fq=b');
    let router: RouterCompat | null = null;

    render(
      <AppRouterCompatProvider>
        <Probe
          calls={freshCalls()}
          onRouter={(r) => {
            router = r;
          }}
        />
      </AppRouterCompatProvider>,
    );

    expect(router?.query).toEqual({ q: 'star', fq: ['a', 'b'] });
    expect(router?.asPath).toBe('/search?q=star&fq=a&fq=b');
  });
});

describe('useRouterCompat', () => {
  test('throws outside a provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Probe calls={freshCalls()} />)).toThrow(/within a RouterCompatProvider/);

    consoleError.mockRestore();
  });
});

// next/router merges dynamic route params into `query` (e.g. `id` on
// /abs/[id]/citations), so rebuilding a URL from it re-emits them. `searchQuery`
// is the search-only view, identical in shape on both routers.
describe('search-only query', () => {
  const pagesRouterValue = (asPath: string, query: Record<string, string | string[]>): RouterCompat => {
    createPagesRouter(asPath, query);
    let router: RouterCompat | undefined;
    render(
      <PagesRouterCompatProvider>
        <Probe calls={freshCalls()} onRouter={(r) => (router = r)} />
      </PagesRouterCompatProvider>,
    );
    if (!router) {
      throw new Error('router was not captured');
    }
    return router;
  };

  const appRouterValue = (pathname: string, search: string): RouterCompat => {
    mocks.appRouter.pathname = pathname;
    mocks.appRouter.searchParams = new URLSearchParams(search);
    let router: RouterCompat | undefined;
    render(
      <AppRouterCompatProvider>
        <Probe calls={freshCalls()} onRouter={(r) => (router = r)} />
      </AppRouterCompatProvider>,
    );
    if (!router) {
      throw new Error('router was not captured');
    }
    return router;
  };

  test('drops a dynamic route param that next/router merged in', () => {
    const router = pagesRouterValue('/abs/2003NanoL...3..459S/citations?p=2', {
      id: '2003NanoL...3..459S',
      p: '2',
    });

    expect(router.searchQuery).toEqual({ p: '2' });
  });

  // Documents why searchQuery has to exist: query itself still carries the
  // route param, because consumers like useSearchReturnTo rely on that.
  test('leaves the route param visible on query itself', () => {
    const router = pagesRouterValue('/abs/2003NanoL...3..459S/citations?p=2', {
      id: '2003NanoL...3..459S',
      p: '2',
    });

    expect(router.query).toHaveProperty('id', '2003NanoL...3..459S');
  });

  test('drops a catch-all route param', () => {
    const router = pagesRouterValue('/user/libraries/abc123?p=3', { id: ['abc123'], p: '3' });

    expect(router.searchQuery).toEqual({ p: '3' });
  });

  test('keeps a repeated search param as an array', () => {
    const router = pagesRouterValue('/search?q=star&fq=a&fq=b', { q: 'star', fq: ['a', 'b'] });

    expect(router.searchQuery).toEqual({ q: 'star', fq: ['a', 'b'] });
  });

  test('is empty when the url has no search string', () => {
    const router = pagesRouterValue('/abs/2003NanoL...3..459S/citations', { id: '2003NanoL...3..459S' });

    expect(router.searchQuery).toEqual({});
  });

  test('matches the parsed search params on the app router', () => {
    const router = appRouterValue('/search', 'q=star&fq=a&fq=b');

    expect(router.searchQuery).toEqual({ q: 'star', fq: ['a', 'b'] });
  });

  test('agrees with query on the app router, where there are no route params', () => {
    const router = appRouterValue('/search', 'q=star&p=2');

    expect(router.searchQuery).toEqual(router.query);
  });
});
