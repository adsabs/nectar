import { describe, expect, test } from 'vitest';

import { render } from '@/test-utils';
import { ItemsSkeleton } from './ItemsSkeleton';
import { RESULT_ITEM_HEIGHT } from './itemHeight';

describe('ItemsSkeleton', () => {
  test('renders one placeholder per requested row', () => {
    const { getAllByTestId } = render(<ItemsSkeleton count={5} />);

    expect(getAllByTestId('item-skeleton')).toHaveLength(5);
  });

  test('reserves the same card height the loaded item uses', () => {
    const { getAllByTestId } = render(<ItemsSkeleton count={1} />);

    expect(getAllByTestId('item-skeleton')[0]).toHaveStyle({ minHeight: RESULT_ITEM_HEIGHT.base });
  });

  test('renders the index rail so the card does not reflow once results arrive', () => {
    const { getByText } = render(<ItemsSkeleton count={3} indexStart={10} />);

    expect(getByText('11')).toBeInTheDocument();
    expect(getByText('13')).toBeInTheDocument();
  });

  test('leaves the placeholder checkbox disabled and out of the tab order', () => {
    const { getAllByRole } = render(<ItemsSkeleton count={2} />);

    const checkboxes = getAllByRole('checkbox', { hidden: true });
    expect(checkboxes).toHaveLength(2);
    checkboxes.forEach((checkbox) => expect(checkbox).toBeDisabled());
  });
});
