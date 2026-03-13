import { render, screen } from '@/test-utils';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import General from '@/pages/feedback/general';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

const mockQuery: Record<string, string> = {};

vi.mock('next/router', () => ({
  useRouter: () => ({
    query: mockQuery,
    asPath: '/feedback/general',
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/feedback/general',
  }),
}));

vi.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: () => ({
    executeRecaptcha: vi.fn(),
  }),
}));

vi.mock('@/api/feedback/feedback', () => ({
  useFeedback: () => ({
    mutate: vi.fn(),
    isLoading: false,
  }),
}));

describe('General Feedback Page', () => {
  afterEach(() => {
    Object.keys(mockQuery).forEach((key) => delete mockQuery[key]);
  });

  test('shows info notice when error_details query param is present', () => {
    mockQuery.error_details = 'Search syntax error near position 10';

    render(<General />);

    expect(screen.getByText(/error details from your search will be included/i)).toBeInTheDocument();
  });

  test('does not show info notice when error_details is absent', () => {
    render(<General />);

    expect(screen.queryByText(/error details from your search will be included/i)).not.toBeInTheDocument();
  });
});
