import { describe, expect, test, vi } from 'vitest';
import { ErrorBoundary } from 'react-error-boundary';
import { fireEvent, render, screen, waitFor, within } from '@/test-utils';
import { defaultQueryParams } from '@/store/slices/search';
import { IUseGetFacetDataProps, useGetFacetData } from '../useGetFacetData';
import { SearchFacets } from '../SearchFacet';

const SIDEBAR_FALLBACK = 'Unable to load filters';
const FACET_FALLBACK = 'Unable to load this filter.';

const emptyFacetData = {
  treeData: [],
  totalResults: 0,
  isFetching: false,
  isLoading: false,
  isSearchLoading: false,
  isError: false,
  canLoadMore: false,
  handlePrevious: vi.fn(),
  handleLoadMore: vi.fn(),
  handlePageChange: vi.fn(),
} as unknown as ReturnType<typeof useGetFacetData>;

vi.mock('@/components/SearchFacet/useGetFacetData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../useGetFacetData')>();
  return {
    ...actual,
    useGetFacetData: (props: IUseGetFacetDataProps) => {
      if (props.field === 'simbad_object_facet_hier') {
        throw new TypeError("Cannot read properties of undefined (reading 'canonical')");
      }
      return emptyFacetData;
    },
  };
});

const renderSidebar = () =>
  render(
    <ErrorBoundary fallbackRender={() => <div>{SIDEBAR_FALLBACK}</div>}>
      <SearchFacets onQueryUpdate={vi.fn()} />
    </ErrorBoundary>,
    { initialStore: { searchStatus: 'success', latestQuery: { ...defaultQueryParams, q: 'star' } } },
  );

const facetToggle = (label: string) => screen.getByRole('button', { name: new RegExp(`Toggle (On|Off) ${label}$`) });

describe('SearchFacets — error containment', () => {
  test('a facet that throws does not take down its siblings', async () => {
    renderSidebar();

    fireEvent.click(facetToggle('SIMBAD Objects'));

    await waitFor(() => {
      expect(screen.getByText(FACET_FALLBACK)).toBeInTheDocument();
    });

    expect(screen.queryByText(SIDEBAR_FALLBACK)).not.toBeInTheDocument();
    expect(facetToggle('Author')).toBeInTheDocument();
    expect(facetToggle('Collections')).toBeInTheDocument();
    expect(facetToggle('NED Objects')).toBeInTheDocument();
  });

  test('a sibling facet still expands and renders its own list after another facet throws', async () => {
    renderSidebar();

    const collectionsFacet = () => within(facetToggle('Collections').closest('li') as HTMLElement);
    const keywordsFacet = () => within(facetToggle('Keywords').closest('li') as HTMLElement);

    expect(collectionsFacet().getByTestId('search-facet-no-results')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Toggle On Keywords$/ })).toBeInTheDocument();

    fireEvent.click(facetToggle('SIMBAD Objects'));

    await waitFor(() => {
      expect(screen.getByText(FACET_FALLBACK)).toBeInTheDocument();
    });

    expect(collectionsFacet().getByTestId('search-facet-no-results')).toBeInTheDocument();

    fireEvent.click(facetToggle('Keywords'));

    await waitFor(() => {
      expect(keywordsFacet().getByTestId('search-facet-no-results')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Toggle Off Keywords$/ })).toBeInTheDocument();
    expect(screen.queryByText(SIDEBAR_FALLBACK)).not.toBeInTheDocument();
  });
});
