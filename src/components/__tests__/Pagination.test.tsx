import { render } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Pagination } from '@/components/ResultList/Pagination';

const ABS_PATH = '/abs/2003NanoL...3..459S/citations';

const mocks = vi.hoisted(() => ({
  useRouter: () => ({
    query: { id: 'foo' },
    asPath: '/search',
    pathname: '/search',
    push: vi.fn(),
  }),
  routerCompat: {
    current: {
      pathname: '/search',
      searchParams: new URLSearchParams(''),
      query: { id: 'foo' } as Record<string, string | string[]>,
      searchQuery: {} as Record<string, string | string[]>,
      asPath: '/search',
      push: vi.fn(),
      replace: vi.fn(),
      onNavigateStart: (): (() => void) => () => undefined,
      onNavigateComplete: (): (() => void) => () => undefined,
    },
  },
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useRouterCompat', () => ({ useRouterCompat: () => mocks.routerCompat.current }));

const onDynamicRoute = () => {
  mocks.routerCompat.current = {
    ...mocks.routerCompat.current,
    pathname: ABS_PATH,
    asPath: `${ABS_PATH}?p=1`,
    searchParams: new URLSearchParams('p=1'),
    // next/router merges the [id] route param into query
    query: { id: '2003NanoL...3..459S', p: '1' },
    searchQuery: { p: '1' },
  };
};

const pageHrefs = (container: HTMLElement): string[] =>
  Array.from(container.querySelectorAll('a[href]')).map((a) => a.getAttribute('href') ?? '');

beforeEach(() => {
  mocks.routerCompat.current = {
    ...mocks.routerCompat.current,
    pathname: '/search',
    asPath: '/search',
    searchParams: new URLSearchParams(''),
    query: { id: 'foo' },
    searchQuery: {},
  };
});

test('renders without crashing', () => {
  render(<Pagination page={1} totalResults={100} />);
});

// On /abs/[id]/citations, next/router puts the route param in `query`, so
// rebuilding a link from it re-emits ?id=<bibcode>. `onlyUpdatePageParam`
// (set by every /abs/[id]/* list) passes query through verbatim and leaks
// it; the default path launders it through makeSearchParams instead.
describe('Pagination links on a dynamic route', () => {
  test('does not re-emit the dynamic route param as a query param', () => {
    onDynamicRoute();

    const { container } = render(<Pagination page={1} totalResults={100} onlyUpdatePageParam />);

    expect(pageHrefs(container).filter((h) => /[?&]id=/.test(h))).toEqual([]);
  });

  test('still advances the page param', () => {
    onDynamicRoute();

    const { container } = render(<Pagination page={1} totalResults={100} onlyUpdatePageParam />);

    expect(pageHrefs(container).some((h) => /[?&]p=2\b/.test(h))).toBe(true);
  });

  test('keeps the resolved path, so the link is not a literal route pattern', () => {
    onDynamicRoute();

    const { container } = render(<Pagination page={1} totalResults={100} onlyUpdatePageParam />);

    expect(pageHrefs(container).every((h) => !h.includes('[id]'))).toBe(true);
    expect(pageHrefs(container).some((h) => h.startsWith(ABS_PATH))).toBe(true);
  });

  test('preserves genuine search params alongside the page', () => {
    onDynamicRoute();
    mocks.routerCompat.current = {
      ...mocks.routerCompat.current,
      asPath: `${ABS_PATH}?p=1&sort=date+desc`,
      searchParams: new URLSearchParams('p=1&sort=date desc'),
      query: { id: '2003NanoL...3..459S', p: '1', sort: 'date desc' },
      searchQuery: { p: '1', sort: 'date desc' },
    };

    const { container } = render(<Pagination page={1} totalResults={100} onlyUpdatePageParam />);

    expect(pageHrefs(container).some((h) => h.includes('sort='))).toBe(true);
  });

  test('the default link path stays clean too', () => {
    onDynamicRoute();

    const { container } = render(<Pagination page={1} totalResults={100} />);

    expect(pageHrefs(container).filter((h) => /[?&]id=/.test(h))).toEqual([]);
  });

  // Guards the assertions above against silently passing on an empty list.
  test('renders page links at all', () => {
    onDynamicRoute();

    const { container } = render(<Pagination page={1} totalResults={100} onlyUpdatePageParam />);

    expect(pageHrefs(container).length).toBeGreaterThan(0);
  });
});
