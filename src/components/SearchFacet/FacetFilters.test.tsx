import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { render } from '@/test-utils';
import { FacetFilters } from './FacetFilters';

const REFEREED_FILTER =
  '/search?q=star&fq=%7B!type%3Daqp+v%3D%24fq_property%7D&fq_property=(property%3A%22refereed%22)';

// Stable per asPath: FacetFilters' effect depends on router.query, and a
// fresh object each render would re-run it forever.
const mocks = vi.hoisted(() => {
  const cache = new Map<string, unknown>();
  return {
    asPath: { current: '/search?q=star' },
    push: vi.fn(),
    routerFor: (asPath: string, push: () => void): unknown => {
      const existing = cache.get(asPath);
      if (existing !== undefined) {
        return existing;
      }
      const search = asPath.split('?')[1] ?? '';
      const params = new URLSearchParams(search);
      const query: Record<string, string> = {};
      params.forEach((value, key) => {
        query[key] = value;
      });
      const router = {
        pathname: '/search',
        asPath,
        query,
        searchParams: params,
        push,
        replace: (): void => undefined,
        onNavigateStart: (): (() => void) => () => undefined,
        onNavigateComplete: (): (() => void) => () => undefined,
      };
      cache.set(asPath, router);
      return router;
    },
  };
});

vi.mock('@/lib/useRouterCompat', () => ({
  useRouterCompat: () => mocks.routerFor(mocks.asPath.current, mocks.push),
}));

vi.mock('@/api/objects/objects', () => ({
  useObjects: (): { data: undefined } => ({ data: undefined }),
}));

beforeEach(() => {
  mocks.asPath.current = '/search?q=star';
  mocks.push.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('FacetFilters', () => {
  // Rendering an empty wrapper instead of nothing would add dead vertical
  // space between the result count and the facet column.
  test('renders nothing when the query carries no filters', () => {
    const { container } = render(<FacetFilters />);

    expect(container.firstChild).toBeEmptyDOMElement();
  });

  test('renders a pill for an applied filter', async () => {
    mocks.asPath.current = REFEREED_FILTER;

    const { findByText } = render(<FacetFilters />);

    expect(await findByText(/refereed/i)).toBeInTheDocument();
  });

  test('offers a way to clear every filter at once', async () => {
    mocks.asPath.current = REFEREED_FILTER;

    const { findByRole } = render(<FacetFilters />);

    expect(await findByRole('button', { name: /remove all filters/i })).toBeInTheDocument();
  });

  test('does not offer the clear-all control with nothing to clear', () => {
    const { queryByRole } = render(<FacetFilters />);

    expect(queryByRole('button', { name: /remove all filters/i })).toBeNull();
  });

  test('navigates shallowly when clearing all filters, so no server round trip', async () => {
    mocks.asPath.current = REFEREED_FILTER;

    const { findByRole, user } = render(<FacetFilters />);
    await user.click(await findByRole('button', { name: /remove all filters/i }));

    expect(mocks.push).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ shallow: true }));
  });

  test('drops the filter from the query it navigates to', async () => {
    mocks.asPath.current = REFEREED_FILTER;

    const { findByRole, user } = render(<FacetFilters />);
    await user.click(await findByRole('button', { name: /remove all filters/i }));

    expect(mocks.push.mock.calls[0]?.[0]).not.toContain('fq_property');
  });
});
