import { describe, expect, test } from 'vitest';

import { render } from '@/test-utils';
import {
  FACET_COLUMN_WIDTH,
  FACET_SKELETON_SECTIONS,
  SearchFacetsPlaceholder,
  SearchFacetsSkeletonContent,
} from './SearchFacetsPlaceholder';

describe('SearchFacetsSkeletonContent', () => {
  test('renders a placeholder for every facet section', () => {
    const { getAllByTestId } = render(<SearchFacetsSkeletonContent />);

    expect(getAllByTestId('facet-section-skeleton')).toHaveLength(FACET_SKELETON_SECTIONS.length);
  });

  test('reserves the year histogram block', () => {
    const { getByTestId } = render(<SearchFacetsSkeletonContent />);

    expect(getByTestId('facet-histogram-skeleton')).toBeInTheDocument();
  });

  test('reserves the filters heading', () => {
    const { getByTestId } = render(<SearchFacetsSkeletonContent />);

    expect(getByTestId('facet-heading-skeleton')).toBeInTheDocument();
  });

  test('describes three expanded sections and eleven collapsed ones', () => {
    const expanded = FACET_SKELETON_SECTIONS.filter((section) => section.rows > 0);
    const collapsed = FACET_SKELETON_SECTIONS.filter((section) => section.rows === 0);

    expect(expanded.map((section) => section.rows)).toEqual([10, 4, 2]);
    expect(collapsed).toHaveLength(11);
  });

  test('gives each expanded section a row placeholder per row it claims', () => {
    const { getAllByTestId } = render(<SearchFacetsSkeletonContent />);
    const expectedRows = FACET_SKELETON_SECTIONS.reduce((total, section) => total + section.rows, 0);

    expect(getAllByTestId('facet-row-skeleton')).toHaveLength(expectedRows);
  });
});

describe('SearchFacetsPlaceholder', () => {
  test('renders the column the results row measures against', () => {
    const { getByTestId } = render(<SearchFacetsPlaceholder />);

    expect(getByTestId('search-facets-placeholder')).toBeInTheDocument();
  });

  test('reserves the same column width the loaded facets occupy', () => {
    expect(FACET_COLUMN_WIDTH).toBe('250px');
  });

  test('carries the skeleton content', () => {
    const { getByTestId } = render(<SearchFacetsPlaceholder />);

    expect(getByTestId('facet-histogram-skeleton')).toBeInTheDocument();
  });
});
