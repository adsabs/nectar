import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { KeywordsForm } from './KeywordsForm';
import { isValidKeyword } from './Utils';

const mocks = vi.hoisted(() => ({
  addMutation: vi.fn(),
  editMutation: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/api/vault/vault', () => ({
  useAddNotification: () => ({
    mutate: mocks.addMutation,
    isLoading: false,
  }),
  useEditNotification: () => ({
    mutate: mocks.editMutation,
    isLoading: false,
  }),
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => mocks.toast,
  };
});

describe('KeywordsForm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.addMutation.mockReset();
    mocks.editMutation.mockReset();
    mocks.toast.mockReset();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test('renders correctly with initial create state', () => {
    render(<KeywordsForm onClose={vi.fn()} />);

    expect(screen.getByTestId('create-keyword-modal')).toBeInTheDocument();
    expect(screen.getByText(/weekly updates on the most recent/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/notification name/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('keyword-input')).toHaveValue('');
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('shows debounced validation feedback for an invalid keyword', async () => {
    render(<KeywordsForm onClose={vi.fn()} />);

    const keywordInput = screen.getByTestId('keyword-input');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    const invalidKeyword = '(';

    expect(isValidKeyword(invalidKeyword)).toBe(false);

    fireEvent.change(keywordInput, { target: { value: invalidKeyword } });

    expect(screen.queryByText(/invalid keyword syntax/i)).not.toBeInTheDocument();
    expect(submitButton).toBeEnabled();

    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(screen.getByText(/invalid keyword syntax/i)).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
  });

  test('enables submit for a valid keyword after debounce', async () => {
    render(<KeywordsForm onClose={vi.fn()} />);

    const keywordInput = screen.getByTestId('keyword-input');
    const submitButton = screen.getByRole('button', { name: /submit/i });
    const validKeyword = 'alpha (beta)';

    expect(isValidKeyword(validKeyword)).toBe(true);

    fireEvent.change(keywordInput, { target: { value: validKeyword } });
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(screen.queryByText(/invalid keyword syntax/i)).not.toBeInTheDocument();
    });
    expect(submitButton).toBeEnabled();
  });

  test('submits a valid keyword through the add notification mutation', async () => {
    const onClose = vi.fn();
    const onUpdated = vi.fn();

    render(<KeywordsForm onClose={onClose} onUpdated={onUpdated} />);

    const keywordInput = screen.getByTestId('keyword-input');
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.change(keywordInput, { target: { value: 'star OR planet' } });
    await vi.advanceTimersByTimeAsync(500);

    fireEvent.click(submitButton);

    expect(mocks.addMutation).toHaveBeenCalledTimes(1);
    expect(mocks.addMutation).toHaveBeenCalledWith(
      {
        type: 'template',
        template: 'keyword',
        data: 'star OR planet',
      },
      expect.objectContaining({
        onSettled: expect.any(Function),
      }),
    );
    expect(mocks.editMutation).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(onUpdated).not.toHaveBeenCalled();
  });
});
