import { describe, expect, test, vi, TestContext } from 'vitest';
import { rest } from 'msw';
import { ErrorBoundary } from 'react-error-boundary';
import { fireEvent, render, screen, waitFor, within } from '@/test-utils';
import { defaultQueryParams } from '@/store/slices/search';
import { ApiTargets } from '@/api/models';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { generateSearchResponse } from '@/mocks/generators/search';
import { IADSApiSearchResponse } from '@/api/search/types';
import { IUseGetFacetDataProps } from '../useGetFacetData';
import { SearchFacets } from '../SearchFacet';

const SIDEBAR_FALLBACK = 'Unable to load filters';
const FACET_FALLBACK = 'Unable to load this filter.';

vi.mock('@/components/SearchFacet/useGetFacetData', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../useGetFacetData')>();
  return {
    ...actual,
    useGetFacetData: (props: IUseGetFacetDataProps) => {
      if (props.field === 'simbad_object_facet_hier') {
        throw new TypeError("Cannot read properties of undefined (reading 'canonical')");
      }
      return actual.useGetFacetData(props);
    },
  };
});

const mockEmptyFacets = (server: TestContext['server']) =>
  server.use(
    rest.get(apiHandlerRoute(ApiTargets.SEARCH), (req, res, ctx) => {
      const requested = req.url.searchParams.get('json.facet');
      const fields = requested ? Object.keys(JSON.parse(requested) as Record<string, unknown>) : [];
      const facets = fields.reduce<IADSApiSearchResponse['facets']>(
        (acc, field) => ({ ...acc, [field]: { numBuckets: 0, buckets: [] } }),
        {},
      );

      return res(ctx.status(200), ctx.json(generateSearchResponse({ facets })));
    }),
  );

const renderSidebar = (server: TestContext['server']) => {
  mockEmptyFacets(server);

  return render(
    <ErrorBoundary fallbackRender={() => <div>{SIDEBAR_FALLBACK}</div>}>
      <SearchFacets onQueryUpdate={vi.fn()} />
    </ErrorBoundary>,
    { initialStore: { searchStatus: 'success', latestQuery: { ...defaultQueryParams, q: 'star' } } },
  );
};

const facetToggle = (label: string) => screen.getByRole('button', { name: new RegExp(`Toggle (On|Off) ${label}$`) });

describe('SearchFacets — error containment', () => {
  test('a facet that throws does not take down its siblings', async ({ server }: TestContext) => {
    renderSidebar(server);

    fireEvent.click(facetToggle('SIMBAD Objects'));

    await waitFor(() => {
      expect(screen.getByText(FACET_FALLBACK)).toBeInTheDocument();
    });

    expect(screen.queryByText(SIDEBAR_FALLBACK)).not.toBeInTheDocument();
    expect(facetToggle('Author')).toBeInTheDocument();
    expect(facetToggle('Collections')).toBeInTheDocument();
    expect(facetToggle('NED Objects')).toBeInTheDocument();
  });

  test('a sibling facet still expands and renders its own list after another facet throws', async ({
    server,
  }: TestContext) => {
    renderSidebar(server);

    const collectionsFacet = () => within(facetToggle('Collections').closest('li') as HTMLElement);
    const keywordsFacet = () => within(facetToggle('Keywords').closest('li') as HTMLElement);

    await waitFor(() => {
      expect(collectionsFacet().getByTestId('search-facet-no-results')).toBeInTheDocument();
    });

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
