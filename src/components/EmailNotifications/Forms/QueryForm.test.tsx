import { render, screen, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { QueryForm } from './QueryForm';

const mocks = vi.hoisted(() => ({
  addNotification: vi.fn(),
  toast: vi.fn(),
  useVaultSearch: vi.fn(),
  searchState: {
    data: undefined as { qid: string } | undefined,
    isFetching: false,
    error: null as Error | null,
  },
}));

vi.mock('@/api/vault/vault', () => ({
  useAddNotification: () => ({
    mutate: mocks.addNotification,
    isLoading: false,
  }),
  useVaultSearch: (query: unknown, options: unknown) => mocks.useVaultSearch(query, options),
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mocks.toast,
  };
});

type MockOption = { id: string | number; label: string; value: string };
type MockSelectProps = {
  id: string;
  label: unknown;
  options: MockOption[];
  value: MockOption;
  onChange: (o: MockOption) => void;
};

vi.mock('@/components/Select', () => ({
  Select: ({ id, label, options, value, onChange }: MockSelectProps) => (
    <select
      aria-label={typeof label === 'string' ? label : 'select'}
      data-testid={id}
      value={String(value?.id ?? '')}
      onChange={(event) => onChange(options.find((option) => String(option.id) === event.target.value))}
    >
      {options.map((option) => (
        <option key={String(option.id)} value={String(option.id)}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

describe('QueryForm', () => {
  const query = { q: 'author:"Ada Lovelace"' };

  beforeEach(() => {
    mocks.addNotification.mockReset();
    mocks.toast.mockReset();
    mocks.useVaultSearch.mockReset();
    mocks.searchState.data = undefined;
    mocks.searchState.isFetching = false;
    mocks.searchState.error = null;

    mocks.useVaultSearch.mockImplementation((_query, options?: { enabled?: boolean }) => ({
      data: options?.enabled ? mocks.searchState.data : undefined,
      isFetching: options?.enabled ? mocks.searchState.isFetching : false,
      error: options?.enabled ? mocks.searchState.error : null,
    }));
  });

  const renderForm = () =>
    render(<QueryForm onClose={vi.fn()} onUpdated={vi.fn()} />, {
      initialStore: {
        query,
      },
    });

  test('renders with the current query and keeps submit disabled when name is empty', () => {
    renderForm();

    expect(screen.getByDisplayValue(query.q)).toHaveAttribute('readonly');
    expect(screen.getByTestId('create-query-modal')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(mocks.useVaultSearch).toHaveBeenLastCalledWith(
      query,
      expect.objectContaining({ enabled: false, staleTime: 0 }),
    );
  });

  test('enables submit once a notification name is typed', async () => {
    const { user } = renderForm();

    await user.type(screen.getByTestId('create-query-name'), 'Saved query alert');

    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  test('submit switches the search hook to enabled', async () => {
    mocks.searchState.isFetching = true;

    const { user } = renderForm();

    await user.type(screen.getByTestId('create-query-name'), 'Saved query alert');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mocks.useVaultSearch).toHaveBeenLastCalledWith(
        query,
        expect.objectContaining({ enabled: true, staleTime: 0 }),
      );
    });
  });

  test('adds a notification with the returned qid after a successful search', async () => {
    mocks.searchState.isFetching = true;

    const { rerender, user } = renderForm();

    await user.type(screen.getByTestId('create-query-name'), 'Saved query alert');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mocks.useVaultSearch).toHaveBeenLastCalledWith(
        query,
        expect.objectContaining({ enabled: true, staleTime: 0 }),
      );
    });

    mocks.searchState.isFetching = false;
    mocks.searchState.data = { qid: 'Q123' };

    rerender(<QueryForm onClose={vi.fn()} onUpdated={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.addNotification).toHaveBeenCalledWith(
        {
          qid: 'Q123',
          frequency: 'daily',
          name: 'Saved query alert',
          type: 'query',
          active: true,
          stateful: true,
        },
        expect.objectContaining({
          onSettled: expect.any(Function),
        }),
      );
    });
  });

  test('shows an error toast when the search fails', async () => {
    mocks.searchState.isFetching = true;

    const { rerender, user } = renderForm();

    await user.type(screen.getByTestId('create-query-name'), 'Saved query alert');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mocks.useVaultSearch).toHaveBeenLastCalledWith(
        query,
        expect.objectContaining({ enabled: true, staleTime: 0 }),
      );
    });

    mocks.searchState.isFetching = false;
    mocks.searchState.error = new Error('Search failed');

    rerender(<QueryForm onClose={vi.fn()} onUpdated={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        status: 'error',
        title: 'Error',
        description: 'Search failed',
      });
    });
    expect(mocks.addNotification).not.toHaveBeenCalled();
  });

  test('submits the selected frequency value', async () => {
    mocks.searchState.isFetching = true;

    const { rerender, user } = renderForm();

    await user.type(screen.getByTestId('create-query-name'), 'Weekly alert');
    await user.selectOptions(screen.getByTestId('frequency-select'), 'weekly');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mocks.useVaultSearch).toHaveBeenLastCalledWith(
        query,
        expect.objectContaining({ enabled: true, staleTime: 0 }),
      );
    });

    mocks.searchState.isFetching = false;
    mocks.searchState.data = { qid: 'Q999' };

    rerender(<QueryForm onClose={vi.fn()} onUpdated={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          qid: 'Q999',
          frequency: 'weekly',
          name: 'Weekly alert',
        }),
        expect.objectContaining({
          onSettled: expect.any(Function),
        }),
      );
    });
  });
});
