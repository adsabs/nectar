import { render, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ListActions } from '../ListActions';

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  return {
    push,
    useRouter: vi.fn(() => ({
      query: { q: 'test query' },
      asPath: '/search?q=test%20query',
      pathname: '/search',
      push,
      events: { on: vi.fn(), off: vi.fn() },
    })),
    useSession: vi.fn(() => ({
      isAuthenticated: false,
      logout: vi.fn(),
    })),
  };
});

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

describe('ListActions export selection handling', () => {
  const defaultProps = {
    onSortChange: vi.fn(),
    onOpenAddToLibrary: vi.fn(),
    isLoading: false,
  };

  const selectedStore = {
    docs: {
      doc: '',
      current: ['2020aaa..1', '2020bbb..2'],
      selected: ['2020aaa..1', '2020bbb..2'],
      isAllSelected: true,
      isSomeSelected: true,
    },
  };

  beforeEach(() => {
    mocks.push.mockClear();
    mocks.useSession.mockReturnValue({ isAuthenticated: false, logout: vi.fn() });
  });

  test('exporting a subselection navigates with a qid and preserves the selection', async () => {
    const { user, getByRole, getByText, getByTestId } = render(<ListActions {...defaultProps} />, {
      initialStore: selectedStore,
    });

    // a subselection is active, so the control is in "selected" mode
    expect(getByTestId('listactions-selected')).toHaveTextContent('2 Selected');

    await user.click(getByRole('button', { name: /Bulk Actions/ }));
    await user.click(getByText('in BibTeX'));

    // the vault request resolves and we navigate with a qid for the subset
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(mocks.push.mock.calls[0][0].query).toHaveProperty('qid');

    // the selection is preserved (not cleared) so the user can act on it again
    expect(getByTestId('listactions-selected')).toHaveTextContent('2 Selected');
  });

  test('switching to "All" after a subselection export omits the stale qid', async () => {
    const { user, getByRole, getByText } = render(<ListActions {...defaultProps} />, {
      initialStore: selectedStore,
    });

    // export the current subselection -> navigates with a qid
    await user.click(getByRole('button', { name: /Bulk Actions/ }));
    await user.click(getByText('in BibTeX'));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(mocks.push.mock.calls[0][0].query).toHaveProperty('qid');

    // switch to "All" (selection still present) and export again. Only the Bulk
    // Actions menu is open, so the single visible "All" radio is unambiguous.
    mocks.push.mockClear();
    await user.click(getByRole('button', { name: /Bulk Actions/ }));
    await user.click(getByRole('menuitemradio', { name: 'All' }));
    await user.click(getByText('in BibTeX'));

    // the "all" export must use the plain query, not the previous subset qid
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(mocks.push.mock.calls[0][0].query).not.toHaveProperty('qid');
  });
});
