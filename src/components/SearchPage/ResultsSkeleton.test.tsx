import { describe, expect, test } from 'vitest';

import { render } from '@/test-utils';
import { LIST_ACTIONS_PLACEHOLDER_HEIGHT, LIST_ACTIONS_PLACEHOLDER_MARGIN, ResultsSkeleton } from './ResultsSkeleton';

const LOADED_LIST_ACTIONS_SPAN = { base: 192, sm: 144, md: 104 };

describe('ResultsSkeleton', () => {
  test('reserves the full span the loaded toolbar occupies at every breakpoint', () => {
    expect({
      base: LIST_ACTIONS_PLACEHOLDER_HEIGHT.base + LIST_ACTIONS_PLACEHOLDER_MARGIN,
      sm: LIST_ACTIONS_PLACEHOLDER_HEIGHT.sm + LIST_ACTIONS_PLACEHOLDER_MARGIN,
      md: LIST_ACTIONS_PLACEHOLDER_HEIGHT.md + LIST_ACTIONS_PLACEHOLDER_MARGIN,
    }).toEqual(LOADED_LIST_ACTIONS_SPAN);
  });

  test('keeps the toolbar box at the measured ListActions height per breakpoint', () => {
    expect(LIST_ACTIONS_PLACEHOLDER_HEIGHT).toEqual({ base: 188, sm: 140, md: 100 });
  });

  test('renders one item placeholder per requested row', () => {
    const { getAllByTestId } = render(<ResultsSkeleton count={7} />);

    expect(getAllByTestId('item-skeleton')).toHaveLength(7);
  });

  test('tracks the requested row count rather than a fixed number', () => {
    const { getAllByTestId } = render(<ResultsSkeleton count={25} />);

    expect(getAllByTestId('item-skeleton')).toHaveLength(25);
  });

  test('carries the facet column placeholder', () => {
    const { getByTestId } = render(<ResultsSkeleton count={3} />);

    expect(getByTestId('search-facets-placeholder')).toBeInTheDocument();
  });

  test('marks itself so a browser check can tell the two states apart', () => {
    const { container } = render(<ResultsSkeleton count={3} />);

    expect(container.querySelector('[data-state="skeleton"]')).toBeInTheDocument();
  });

  test('puts the result count above the applied filters, as the loaded page does', () => {
    const { getByTestId } = render(<ResultsSkeleton count={3} />);

    const numFound = getByTestId('num-found-slot');
    const filters = getByTestId('facet-filters-slot');

    expect(numFound.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('puts the applied filters above the facet column', () => {
    const { getByTestId } = render(<ResultsSkeleton count={3} />);

    const filters = getByTestId('facet-filters-slot');
    const facets = getByTestId('search-facets-placeholder');

    expect(filters.compareDocumentPosition(facets) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
