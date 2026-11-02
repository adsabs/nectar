import { render } from '@/test-utils';
import { expect, test } from 'vitest';
import { APP_DEFAULTS } from '@/config';
import { ItemsSkeleton } from './ItemsSkeleton';

const skeletonItems = (container: HTMLElement) => container.querySelectorAll('[data-testid="results-skeleton-item"]');

test('renders one placeholder per expected result when the count is small', () => {
  const { container } = render(<ItemsSkeleton count={3} />);

  expect(skeletonItems(container)).toHaveLength(3);
});

test('caps placeholders so a 500-per-page search does not render 500 of them', () => {
  const { container } = render(<ItemsSkeleton count={500} />);
  const rendered = skeletonItems(container).length;

  expect(rendered, 'a loading list must still show placeholders').toBeGreaterThan(0);
  expect(
    rendered,
    'a 500-row page must not render 500 animated skeleton blocks on the critical path',
  ).toBeLessThanOrEqual(APP_DEFAULTS.RESULT_PER_PAGE);
});

test('renders nothing when there are no results to wait for', () => {
  const { container } = render(<ItemsSkeleton count={0} />);

  expect(skeletonItems(container)).toHaveLength(0);
});
