import { render } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { FacetFilters } from '../FacetFilters';

const mockPush = vi.fn();
const routerRef = { asPath: '/search?q=star' };

vi.mock('next/router', () => ({
  useRouter: () => ({
    asPath: routerRef.asPath,
    query: routerRef.asPath,
    pathname: '/search',
    push: mockPush,
  }),
}));

const DATABASE_FQ = 'fq=%7B!type%3Daqp%20v%3D%24fq_database%7D';

describe('FacetFilters — collection alias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerRef.asPath = '/search?q=star';
  });

  test('labels a database filter pill as "collection"', () => {
    routerRef.asPath = `/search?q=star&${DATABASE_FQ}&fq_database=${encodeURIComponent('(database:"astronomy")')}`;

    const { getByText } = render(<FacetFilters />);

    expect(getByText('collection: astronomy')).toBeInTheDocument();
  });
});

describe('FacetFilters — collection splitting in ADS compat mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerRef.asPath = '/search?q=star';
  });

  test('renders one pill per collection for an OR-joined database filter', () => {
    routerRef.asPath = `/search?q=star&ads_compat=1&${DATABASE_FQ}&fq_database=${encodeURIComponent(
      '(database:"astronomy" OR database:"physics")',
    )}`;

    const { getByText, queryByText } = render(<FacetFilters />);

    expect(getByText('collection: astronomy')).toBeInTheDocument();
    expect(getByText('collection: physics')).toBeInTheDocument();
    expect(queryByText('collection: astronomy OR physics')).not.toBeInTheDocument();
  });

  test('shows a non-interactive operator chip between split collection pills', () => {
    routerRef.asPath = `/search?q=star&ads_compat=1&${DATABASE_FQ}&fq_database=${encodeURIComponent(
      '(database:"astronomy" OR database:"physics")',
    )}`;

    const { getByText } = render(<FacetFilters />);

    const operator = getByText('OR');
    expect(operator).toBeInTheDocument();
    expect(operator.closest('button')).toBeNull();
    expect(operator.querySelector('button')).toBeNull();
  });

  test('removing one collection pill keeps the remaining collection and compat mode', async () => {
    routerRef.asPath = `/search?q=star&ads_compat=1&${DATABASE_FQ}&fq_database=${encodeURIComponent(
      '(database:"astronomy" OR database:"physics")',
    )}`;

    const { user, container } = render(<FacetFilters />);

    const closeButton = container.querySelector('[data-value="astronomy"]');
    await user.click(closeButton);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const search = decodeURIComponent((mockPush.mock.calls[0][0] as { search: string }).search);
    expect(search).toContain('database:"physics"');
    expect(search).not.toContain('astronomy');
    expect(search).toContain('ads_compat=1');
  });
});

describe('FacetFilters — collection split edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerRef.asPath = '/search?q=star';
  });

  test('keeps an AND-joined collection filter as a single combined pill', () => {
    routerRef.asPath = `/search?q=star&ads_compat=1&${DATABASE_FQ}&fq_database=${encodeURIComponent(
      '(database:"astronomy" AND database:"physics")',
    )}`;

    const { getByText, queryByText } = render(<FacetFilters />);

    expect(getByText('collection: astronomy AND physics')).toBeInTheDocument();
    expect(queryByText('collection: astronomy')).not.toBeInTheDocument();
    expect(queryByText('collection: physics')).not.toBeInTheDocument();
    expect(queryByText('AND')).not.toBeInTheDocument();
  });

  test('splits only the OR group when an AND group sits alongside it', () => {
    routerRef.asPath = `/search?q=star&ads_compat=1&${DATABASE_FQ}&fq_database=${encodeURIComponent(
      '(database:"astronomy" OR database:"physics") AND (database:"general")',
    )}`;

    const { getByText, queryByText, queryAllByText } = render(<FacetFilters />);

    expect(getByText('collection: astronomy')).toBeInTheDocument();
    expect(getByText('collection: physics')).toBeInTheDocument();
    expect(getByText('collection: general')).toBeInTheDocument();
    expect(queryAllByText('OR')).toHaveLength(1);
    expect(queryByText('AND')).not.toBeInTheDocument();
  });

  test('removing the last collection pill drops the filter entirely', async () => {
    routerRef.asPath = `/search?q=star&ads_compat=1&${DATABASE_FQ}&fq_database=${encodeURIComponent(
      '(database:"astronomy")',
    )}`;

    const { user, container } = render(<FacetFilters />);

    await user.click(container.querySelector('[data-value="astronomy"]'));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const search = decodeURIComponent((mockPush.mock.calls[0][0] as { search: string }).search);
    expect(search).not.toContain('fq_database');
    expect(search).not.toContain('fq=');
    expect(search).toContain('ads_compat=1');
  });
});

describe('FacetFilters — splitting is scoped', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerRef.asPath = '/search?q=star';
  });

  test('keeps one combined collection pill when compat mode is off', () => {
    routerRef.asPath = `/search?q=star&${DATABASE_FQ}&fq_database=${encodeURIComponent(
      '(database:"astronomy" OR database:"physics")',
    )}`;

    const { getByText, queryByText } = render(<FacetFilters />);

    expect(getByText('collection: astronomy OR physics')).toBeInTheDocument();
    expect(queryByText('collection: astronomy')).not.toBeInTheDocument();
  });

  test('leaves other facets combined while compat mode splits collections', () => {
    const authorFq = 'fq=%7B!type%3Daqp%20v%3D%24fq_author%7D';
    routerRef.asPath = `/search?q=star&ads_compat=1&${DATABASE_FQ}&${authorFq}&fq_database=${encodeURIComponent(
      '(database:"astronomy" OR database:"physics")',
    )}&fq_author=${encodeURIComponent('(author_facet_hier:"0/Smith, J" OR author_facet_hier:"0/Doe, A")')}`;

    const { getByText } = render(<FacetFilters />);

    expect(getByText('collection: astronomy')).toBeInTheDocument();
    expect(getByText('author: Smith, J OR Doe, A')).toBeInTheDocument();
  });
});
