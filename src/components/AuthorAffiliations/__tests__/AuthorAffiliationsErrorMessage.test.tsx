import { render } from '@/test-utils';
import { expect, test, vi } from 'vitest';

// SUT
import { AuthorAffiliationsErrorMessage, errorMessages } from '../ErrorMessage';

// Mock parseAPIError so we control message mapping
vi.mock('@/utils/common/parseAPIError', () => ({
  parseAPIError: (e: unknown) => (typeof e === 'string' ? e : 'Unknown Server Error'),
}));

test('renders default title and generic message', () => {
  const { getByText } = render(<AuthorAffiliationsErrorMessage error={'something unknown'} />);
  expect(getByText('Sorry, we were unable to generate the affiliations form')).toBeTruthy();
  expect(getByText('Please try reloading the page to see if the error persists.')).toBeTruthy();
});

test('shows custom title when provided', () => {
  const { getByText } = render(<AuthorAffiliationsErrorMessage title="Custom Title" error={'something unknown'} />);
  expect(getByText('Custom Title')).toBeTruthy();
});

test('maps specific messages: noResults', () => {
  const { getByText } = render(<AuthorAffiliationsErrorMessage error={errorMessages.noResults} />);
  expect(getByText(/No results were found for this query/i)).toBeTruthy();
});

test('shows retry button when resetErrorBoundary is provided', async () => {
  const reset = vi.fn();
  const { user, getByRole } = render(<AuthorAffiliationsErrorMessage error={'x'} resetErrorBoundary={reset} />);
  await user.click(getByRole('button', { name: /try again/i }));
  expect(reset).toHaveBeenCalled();
});
