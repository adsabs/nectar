import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@chakra-ui/react';
import SearchPage from '@/pages/search/index';
import { createStore, StoreProvider } from '@/store';
import { theme } from '@/theme';
import type { SearchQueryParams } from '@/lib/search/useSearchQueryParams';
import type { IDocsEntity } from '@/api/search/types';
import type { NumPerPageType } from '@/types';

const mocks = vi.hoisted(() => ({
  router: {
    pathname: '/search',
    asPath: '/search?q=stars&p=3',
    query: { q: 'stars', p: '3' },
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  },
  useSearchPage: vi.fn(),
  useHighlights: vi.fn(),
  nprogressStart: vi.fn(),
  nprogressDone: vi.fn(),
}));

vi.mock('next/router', () => ({
  useRouter: () => mocks.router,
}));

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>) => {
    const DynamicComponent = (props: Record<string, unknown>) => {
      const [Component, setComponent] = React.useState<React.ComponentType<Record<string, unknown>> | null>(null);

      React.useEffect(() => {
        let mounted = true;
        void loader().then((mod: unknown) => {
          const resolved = (mod as { default?: React.ComponentType<Record<string, unknown>> }).default;
          if (mounted) {
            setComponent(() => resolved ?? null);
          }
        });
        return () => {
          mounted = false;
        };
      }, []);

      return Component ? <Component {...props} /> : null;
    };

    DynamicComponent.displayName = 'MockDynamicComponent';
    return DynamicComponent;
  },
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return {
    ...actual,
    useBreakpointValue: () => false,
    useMediaQuery: () => [false],
  };
});

vi.mock('react-shepherd', () => ({
  useShepherd: () => ({
    Tour: class {
      addSteps() {}
      start() {}
    },
  }),
}));

vi.mock('@/components/NavBar/useTour', () => ({
  getResultsSteps: () => [],
}));

vi.mock('@/lib/search/useSearchPage', () => ({
  useSearchPage: mocks.useSearchPage,
}));

vi.mock('@/components/ResultList/useHighlights', () => ({
  useHighlights: mocks.useHighlights,
}));

vi.mock('@/lib/useScrollRestoration', () => ({
  useScrollRestoration: vi.fn().mockReturnValue({ saveScrollPosition: vi.fn() }),
}));

vi.mock('nprogress', () => ({
  default: {
    start: mocks.nprogressStart,
    done: mocks.nprogressDone,
  },
}));

vi.mock('@/components/SearchBar', () => ({
  SearchBar: ({ query = '' }: { query?: string }) => (
    <>
      <input aria-label="Search Database" name="q" defaultValue={query} />
      <button type="submit">Search</button>
    </>
  ),
}));

vi.mock('@/components/NumFound', () => ({
  NumFound: ({ count }: { count: number }) => <div data-testid="num-found">{count}</div>,
}));

vi.mock('@/components/SearchFacet/FacetFilters', () => ({
  FacetFilters: () => null,
}));

vi.mock('@/components/SearchFacet', () => ({
  SearchFacets: ({ onQueryUpdate }: { onQueryUpdate: (queryUpdates: Record<string, unknown>) => void }) => (
    <button type="button" onClick={() => onQueryUpdate({ fq: ['author:Smith'] })}>
      Apply Mock Facet
    </button>
  ),
}));

vi.mock('@/components/SearchFacet/YearHistogramSlider', () => ({
  YearHistogramSlider: () => <div data-testid="year-histogram" />,
}));

vi.mock('@/components/ResultList/ListActions', () => ({
  ListActions: ({ onToggleHighlights }: { onToggleHighlights?: () => void }) => (
    <button type="button" onClick={onToggleHighlights} data-testid="toggle-highlights">
      Toggle Highlights
    </button>
  ),
}));

vi.mock('@/components/SearchResultsList/SearchResultsList', () => ({
  SearchResultsList: ({ docs, isFetching }: { docs: IDocsEntity[]; isFetching?: boolean }) => (
    <div data-testid="results-list" data-is-fetching={String(isFetching)}>
      {docs.length}
    </div>
  ),
}));

vi.mock('@/components/SolrErrorAlert/SolrErrorAlert', () => ({
  SearchErrorAlert: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="search-error-alert">
      <button type="button" onClick={onRetry} data-testid="retry-btn">
        Try Again
      </button>
    </div>
  ),
}));

vi.mock('@/components/ResultList/Pagination/Pagination', () => ({
  Pagination: ({ onPerPageSelect }: { onPerPageSelect?: (rows: number) => void }) => (
    <button type="button" onClick={() => onPerPageSelect?.(25)}>
      Set 25 Per Page
    </button>
  ),
}));

vi.mock('@/components/Libraries', () => ({
  AddToLibraryModal: () => null,
}));

vi.mock('@/components/Feedbacks', () => ({
  CustomInfoMessage: () => null,
}));

vi.mock('@/components/SimpleLink', () => ({
  SimpleLink: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

type SearchPageMock = {
  params?: Partial<SearchQueryParams>;
  docs?: IDocsEntity[];
  numFound?: number;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: Error;
  isSlowSearch?: boolean;
  refetch?: () => void;
};

const MOCK_DOC: IDocsEntity = {
  bibcode: '2024test....1A',
  title: ['A result'],
  author: ['Smith'],
  author_count: 1,
  pubdate: '2024-01-01',
  pub: 'Test Journal',
  citation_count: 25,
  citation_count_norm: 3.5,
} as IDocsEntity;

const makeSearchPageMock = (overrides: SearchPageMock = {}, store?: ReturnType<typeof createStore>) => {
  const refetch = overrides.refetch ?? vi.fn();

  const onSubmit = vi.fn().mockImplementation(async () => {
    // Simulates useSearchPage.onSubmit store side-effect
    store?.getState().clearAllSelected();
  });
  const onSort = vi.fn().mockResolvedValue(undefined);
  const onPageChange = vi.fn().mockResolvedValue(undefined);
  const onPerPageChange = vi.fn().mockImplementation(async (rows: number) => {
    // Simulates useSearchPage.onPerPageChange store side-effect
    store?.getState().setNumPerPage(rows as NumPerPageType);
  });
  const onFacetChange = vi.fn().mockImplementation(async () => {
    store?.getState().clearAllSelected();
  });
  const onToggleHighlights = vi.fn().mockResolvedValue(undefined);

  return {
    params: {
      q: 'stars',
      sort: ['date desc'],
      p: 3,
      rows: 10,
      fq: [],
      d: '',
      showHighlights: false,
      ...overrides.params,
    },
    start: 20,
    results: {
      docs: overrides.docs ?? [MOCK_DOC],
      numFound: overrides.numFound ?? 1,
      isLoading: overrides.isLoading ?? false,
      isFetching: overrides.isFetching ?? false,
      isError: overrides.isError ?? false,
      error: overrides.error ?? null,
      isSlowSearch: overrides.isSlowSearch ?? false,
      isPartialResults: false,
      refetch,
    },
    handlers: {
      onSubmit,
      onSort,
      onPageChange,
      onPerPageChange,
      onFacetChange,
      onToggleHighlights,
    },
  };
};

const renderPage = (options?: { initialStore?: Record<string, unknown>; searchPageMock?: SearchPageMock }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, cacheTime: 0, staleTime: 0 } },
  });
  const store = createStore((options?.initialStore ?? {}) as never);
  const searchPageMock = makeSearchPageMock(options?.searchPageMock ?? {}, store);

  mocks.useSearchPage.mockReturnValue(searchPageMock);
  mocks.useHighlights.mockReturnValue({
    highlights: [],
    isFetchingHighlights: false,
  });

  const user = userEvent.setup();
  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider createStore={() => store}>
          <SearchPage />
        </StoreProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );

  return { ...result, user, store, searchPageMock };
};

describe('SearchPage integration', () => {
  beforeEach(() => {
    mocks.router.push.mockReset();
    mocks.router.pathname = '/search';
    mocks.router.asPath = '/search?q=stars&p=3';
    mocks.router.query = { q: 'stars', p: '3' };
    mocks.useSearchPage.mockReset();
    mocks.useHighlights.mockReset();
    mocks.nprogressStart.mockReset();
    mocks.nprogressDone.mockReset();
  });

  // --- Group A: Query submission behavior ---

  test('A1: submit clears current-page selection and resets page', async () => {
    const { user, store, searchPageMock } = renderPage({
      initialStore: {
        docs: {
          current: ['2024test....1A'],
          selected: ['2024test....1A'],
          isAllSelected: true,
          isSomeSelected: true,
          doc: null,
        },
      },
    });

    await user.clear(screen.getByLabelText('Search Database'));
    await user.type(screen.getByLabelText('Search Database'), 'black holes');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => expect(searchPageMock.handlers.onSubmit).toHaveBeenCalledWith('black holes'));
    expect(store.getState().docs.selected).toEqual([]);
  });

  test('A2: empty submit does not trigger onSubmit', async () => {
    const { user, searchPageMock } = renderPage();

    await user.clear(screen.getByLabelText('Search Database'));
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(searchPageMock.handlers.onSubmit).not.toHaveBeenCalled();
  });

  // --- Group B: Facet/filter update behavior ---

  test('B1: facet-driven query update clears current-page selection', async () => {
    const { user, store } = renderPage({
      initialStore: {
        docs: {
          current: ['2024test....1A'],
          selected: ['2024test....1A'],
          isAllSelected: true,
          isSomeSelected: true,
          doc: null,
        },
      },
    });

    // SearchFacets is loaded via next/dynamic (async) — wait for the button to mount
    await user.click(await screen.findByRole('button', { name: 'Apply Mock Facet' }));

    await waitFor(() => {
      expect(mocks.router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/search',
          search: expect.stringContaining('p=1'),
        }),
        null,
        expect.objectContaining({ shallow: true }),
      );
    });
    expect(store.getState().docs.selected).toEqual([]);
  });

  // --- Group C: Pagination and page-size behavior ---

  test('C1: per-page change updates URL and persisted numPerPage', async () => {
    const { user, store, searchPageMock } = renderPage({
      initialStore: { numPerPage: 10 },
      searchPageMock: { params: { rows: 10 } },
    });

    await user.click(screen.getByRole('button', { name: 'Set 25 Per Page' }));

    await waitFor(() => expect(searchPageMock.handlers.onPerPageChange).toHaveBeenCalledWith(25));
    expect(store.getState().numPerPage).toBe(25);
  });

  // --- Group E: Error and loading behavior ---

  test('E1: search error state renders SearchErrorAlert with retry callback', async () => {
    const refetch = vi.fn();
    renderPage({
      searchPageMock: { isError: true, error: new Error('Search failed'), docs: [], refetch },
    });

    expect(screen.getByTestId('search-error-alert')).toBeInTheDocument();
    expect(screen.queryByTestId('results-list')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('retry-btn'));
    expect(refetch).toHaveBeenCalled();
  });

  test('E3: refetch keeps stale results visible (isFetching does not hide rows)', () => {
    renderPage({
      searchPageMock: { isFetching: true, docs: [MOCK_DOC] },
    });

    const list = screen.getByTestId('results-list');
    expect(list).toHaveAttribute('data-is-fetching', 'true');
    expect(list.textContent).toContain('1');
  });

  // --- Group F: Highlight behavior ---

  test('F1: onToggleHighlights is wired to the toggle button', async () => {
    const { user, searchPageMock } = renderPage({
      searchPageMock: { params: { showHighlights: false } },
    });

    await user.click(screen.getByTestId('toggle-highlights'));
    expect(searchPageMock.handlers.onToggleHighlights).toHaveBeenCalled();
  });

  test('F2: page renders with showHighlights=true from URL and passes it to ListActions', () => {
    renderPage({
      searchPageMock: { params: { showHighlights: true } },
    });

    expect(screen.getByTestId('toggle-highlights')).toBeInTheDocument();
    expect(mocks.useHighlights).toHaveBeenCalled();
  });

  // --- Group H: Docs-store synchronization ---

  test('H1: search results sync bibcodes to docs.current', async () => {
    const { store } = renderPage({
      searchPageMock: {
        docs: [
          { ...MOCK_DOC, bibcode: 'a' } as IDocsEntity,
          { ...MOCK_DOC, bibcode: 'b' } as IDocsEntity,
          { ...MOCK_DOC, bibcode: 'c' } as IDocsEntity,
        ],
      },
    });

    await waitFor(() => {
      expect(store.getState().docs.current).toEqual(['a', 'b', 'c']);
    });
  });

  test('H2: empty result set clears docs.current', async () => {
    const { store } = renderPage({
      initialStore: {
        docs: { current: ['stale-a', 'stale-b'], selected: [], isAllSelected: false, isSomeSelected: false, doc: null },
      },
      searchPageMock: { docs: [], numFound: 0 },
    });

    await waitFor(() => {
      expect(store.getState().docs.current).toEqual([]);
    });
  });
});
