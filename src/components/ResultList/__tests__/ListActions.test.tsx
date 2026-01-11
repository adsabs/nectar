import { render } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ListActions } from '../ListActions';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: { q: 'test query' },
    asPath: '/search?q=test%20query',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
  useSession: vi.fn(() => ({
    isAuthenticated: false,
    logout: vi.fn(),
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));

describe('ListActions notification bell button', () => {
  const defaultProps = {
    onSortChange: vi.fn(),
    onOpenAddToLibrary: vi.fn(),
    isLoading: false,
  };

  describe.concurrent('unauthenticated user', () => {
    test('shows login prompt popover with correct links when bell is clicked', async () => {
      mocks.useSession.mockReturnValue({ isAuthenticated: false, logout: vi.fn() });

      const { user, getByLabelText, findByText, findByRole } = render(<ListActions {...defaultProps} />);

      const bellButton = getByLabelText('Create email notification for this query (login required)');
      expect(bellButton).toBeInTheDocument();

      await user.click(bellButton);

      expect(await findByText('Login Required')).toBeInTheDocument();
      expect(await findByText('Email notifications are only available for logged-in users.')).toBeInTheDocument();

      const loginLink = await findByRole('link', { name: 'Login' });
      expect(loginLink).toHaveAttribute('href', '/user/account/login');

      const registerLink = await findByRole('link', { name: 'Create Account' });
      expect(registerLink).toHaveAttribute('href', '/user/account/register');
    });
  });

  describe.concurrent('authenticated user', () => {
    test('sees normal bell button without login prompt', () => {
      mocks.useSession.mockReturnValue({ isAuthenticated: true, logout: vi.fn() });

      const { getByLabelText, queryByText } = render(<ListActions {...defaultProps} />);

      const bellButton = getByLabelText('Create email notification for this query');
      expect(bellButton).toBeInTheDocument();
      expect(queryByText('Login Required')).not.toBeInTheDocument();
    });
  });
});
