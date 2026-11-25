import { render } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { IADSApiSearchParams } from '@/api/search/types';
import { YearHistogramSlider } from './YearHistogramSlider';

const mocks = vi.hoisted(() => ({
  useGetSearchFacetCounts: vi.fn(),
  useRouter: vi.fn(() => ({ pathname: '/search', query: {}, asPath: '/search', push: vi.fn() })),
}));

vi.mock('@/api/search/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search/search')>();
  return { ...actual, useGetSearchFacetCounts: mocks.useGetSearchFacetCounts };
});
vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

const baseQuery: IADSApiSearchParams = {
  q: 'star',
  sort: ['score desc'],
  start: 0,
  rows: 10,
};

const paramsForQuery = (latestQuery: IADSApiSearchParams): IADSApiSearchParams => {
  mocks.useGetSearchFacetCounts.mockClear();

  const { unmount } = render(<YearHistogramSlider onQueryUpdate={vi.fn()} width={300} height={100} />, {
    initialStore: { latestQuery, searchStatus: 'success' },
  });

  const call = mocks.useGetSearchFacetCounts.mock.calls[0];
  expect(call, 'the histogram never asked for facet counts').toBeDefined();
  unmount();

  return call[0] as IADSApiSearchParams;
};

describe('the year histogram does not refetch on paging (criterion 6b)', () => {
  beforeEach(() => {
    mocks.useGetSearchFacetCounts.mockReturnValue({ data: undefined });
  });

  test('asks for the same params when only start changes', () => {
    const firstPage = paramsForQuery({ ...baseQuery, start: 0 });
    const secondPage = paramsForQuery({ ...baseQuery, start: 10 });

    expect(firstPage['facet.pivot']).toBe('property,year');
    expect(secondPage).toEqual(firstPage);
  });

  test('asks for the same params when only rows changes', () => {
    const tenPerPage = paramsForQuery({ ...baseQuery, rows: 10 });
    const twentyFivePerPage = paramsForQuery({ ...baseQuery, rows: 25 });

    expect(tenPerPage['facet.pivot']).toBe('property,year');
    expect(twentyFivePerPage).toEqual(tenPerPage);
  });

  test('still distinguishes a different search', () => {
    const star = paramsForQuery({ ...baseQuery, q: 'star' });
    const galaxy = paramsForQuery({ ...baseQuery, q: 'galaxy' });

    expect(galaxy).not.toEqual(star);
    expect(galaxy.q).toBe('galaxy');
  });
});
