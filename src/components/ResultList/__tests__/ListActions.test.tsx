import { render } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ListActions } from '../ListActions';
import { LIST_ACTIONS_HEIGHT_CSS } from '../listActionsHeight';

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
  routerCompat: {
    pathname: '/search',
    searchParams: new URLSearchParams('?q=test%20query'),
    query: { q: 'test query' },
    asPath: '/search?q=test%20query',
    push: vi.fn(),
    replace: vi.fn(),
    onNavigateStart: (): (() => void) => () => undefined,
    onNavigateComplete: (): (() => void) => () => undefined,
  },
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useRouterCompat', () => ({ useRouterCompat: () => mocks.routerCompat }));
vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));

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

describe('ListActions reserved height', () => {
  const defaultProps = {
    onSortChange: vi.fn(),
    onOpenAddToLibrary: vi.fn(),
    isLoading: false,
  };

  test('reserves the toolbar height so the client-only rows cannot push results down', () => {
    const { getByTestId } = render(<ListActions {...defaultProps} />);

    expect(getByTestId('listactions')).toHaveStyle({ minHeight: LIST_ACTIONS_HEIGHT_CSS.base });
  });
});
