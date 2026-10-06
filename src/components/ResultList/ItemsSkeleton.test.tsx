import { describe, expect, test } from 'vitest';

import { render } from '@/test-utils';
import { ItemsSkeleton } from './ItemsSkeleton';
import { RESULT_ITEM_HEIGHT } from './itemHeight';
import { LIST_ACTIONS_HEIGHT } from './listActionsHeight';

describe('ItemsSkeleton', () => {
  test('renders one placeholder per requested row', () => {
    const { getAllByTestId } = render(<ItemsSkeleton count={5} />);

    expect(getAllByTestId('item-skeleton')).toHaveLength(5);
  });

  test('stays a neutral placeholder by default, for lists that are not the search results', () => {
    const { getAllByTestId, queryByTestId, queryByText } = render(<ItemsSkeleton count={3} />);

    expect(getAllByTestId('item-skeleton')[0]).not.toHaveStyle({ minHeight: RESULT_ITEM_HEIGHT.base });
    expect(queryByTestId('item-skeleton-checkbox')).not.toBeInTheDocument();
    expect(queryByText('1')).not.toBeInTheDocument();
  });

  test('reserves the search card height only when asked', () => {
    const { getAllByTestId } = render(<ItemsSkeleton count={1} reserveItemHeight />);

    expect(getAllByTestId('item-skeleton')[0]).toHaveStyle({ minHeight: RESULT_ITEM_HEIGHT.base });
  });

  test('renders the index rail from the page offset when asked', () => {
    const { getByText } = render(<ItemsSkeleton count={3} indexStart={10} showIndexRail />);

    expect(getByText('11')).toBeInTheDocument();
    expect(getByText('13')).toBeInTheDocument();
  });

  test('renders the checkbox slot as decoration, not a focusable control', () => {
    const { getAllByTestId, queryByRole } = render(<ItemsSkeleton count={2} showIndexRail />);

    expect(getAllByTestId('item-skeleton-checkbox')).toHaveLength(2);
    expect(queryByRole('checkbox', { hidden: true })).not.toBeInTheDocument();
  });

  test('omits the checkbox slot for lists that do not offer selection', () => {
    const { queryByTestId } = render(<ItemsSkeleton count={2} showIndexRail hideCheckbox />);

    expect(queryByTestId('item-skeleton-checkbox')).not.toBeInTheDocument();
  });
});

describe('measured geometry constants', () => {
  test('pins the card heights measured against the running app', () => {
    expect(RESULT_ITEM_HEIGHT).toEqual({ base: '264px', md: '153px' });
  });

  test('pins the toolbar heights measured against the running app', () => {
    expect(LIST_ACTIONS_HEIGHT).toEqual({ base: 188, sm: 140, md: 100 });
  });
});
