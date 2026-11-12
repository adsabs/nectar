import { render } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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

describe('ListActions select-all gating', () => {
  const selectAllProps = {
    onSortChange: vi.fn(),
    onOpenAddToLibrary: vi.fn(),
    onOpenRemoveFromLibrary: vi.fn(),
    isLoading: false,
  };

  test('select all is available once the whole result set has loaded', () => {
    const { getByRole } = render(<ListActions {...selectAllProps} isFullSetLoaded />);

    expect(getByRole('checkbox', { name: 'select all' })).toBeEnabled();
  });

  test('select all is unavailable while the result set is still filling', () => {
    const { getByRole } = render(<ListActions {...selectAllProps} isFullSetLoaded={false} />);

    expect(getByRole('checkbox', { name: 'select all' })).toBeDisabled();
  });

  test('a disabled select all explains itself on hover', async () => {
    const { user, getByRole, findByText } = render(<ListActions {...selectAllProps} isFullSetLoaded={false} />);

    await user.hover(getByRole('checkbox', { name: 'select all' }));

    expect(await findByText('Loading all results')).toBeInTheDocument();
  });

  test('a loaded select all has no explanatory tooltip', async () => {
    const { user, getByRole, queryByText } = render(<ListActions {...selectAllProps} isFullSetLoaded />);

    await user.hover(getByRole('checkbox', { name: 'select all' }));

    expect(queryByText('Loading all results')).not.toBeInTheDocument();
  });
});

describe('ListActions notification bell button', () => {
  const defaultProps = {
    onSortChange: vi.fn(),
    onOpenAddToLibrary: vi.fn(),
    isLoading: false,
  };

  describe('unauthenticated user', () => {
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

  describe('authenticated user', () => {
    test('sees normal bell button without login prompt', () => {
      mocks.useSession.mockReturnValue({ isAuthenticated: true, logout: vi.fn() });

      const { getByLabelText, queryByText } = render(<ListActions {...defaultProps} />);

      const bellButton = getByLabelText('Create email notification for this query');
      expect(bellButton).toBeInTheDocument();
      expect(queryByText('Login Required')).not.toBeInTheDocument();
    });
  });
});

describe('ListActions abstracts toggle', () => {
  const defaultProps = {
    onSortChange: vi.fn(),
    onOpenAddToLibrary: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    mocks.useSession.mockReturnValue({ isAuthenticated: false, logout: vi.fn() });
  });

  test('renders an abstracts toggle button that starts in the show state', () => {
    const { getByLabelText } = render(<ListActions {...defaultProps} />);

    const toggle = getByLabelText('Show abstract previews for all results.');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('data-tour', 'view-all-abstracts');
  });

  test('flips accessible name to the hide state when clicked', async () => {
    const { user, getByLabelText } = render(<ListActions {...defaultProps} />);

    await user.click(getByLabelText('Show abstract previews for all results.'));

    expect(getByLabelText('Hide abstract previews for all results.')).toBeInTheDocument();
  });
});
