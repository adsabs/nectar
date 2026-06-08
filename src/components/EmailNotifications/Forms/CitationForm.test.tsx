import { render } from '@/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CitationForm } from './CitationForm';
import { isValidOrcidId } from '@/api/orcid/models';

const addNotificationMock = vi.fn();
const editNotificationMock = vi.fn();
const toastMock = vi.fn();

vi.mock('@/api/vault/vault', () => ({
  useAddNotification: () => ({
    mutate: addNotificationMock,
    isLoading: false,
  }),
  useEditNotification: () => ({
    mutate: editNotificationMock,
    isLoading: false,
  }),
}));

vi.mock('@chakra-ui/react', async () => {
  const actual = await vi.importActual<typeof import('@chakra-ui/react')>('@chakra-ui/react');

  return {
    ...actual,
    useToast: () => toastMock,
  };
});

describe('CitationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders create mode with empty input and disabled submit state', () => {
    render(<CitationForm onClose={vi.fn()} template="citations" />);

    expect(screen.getByTestId('create-citations-modal')).toBeInTheDocument();
    expect(screen.getByLabelText('new author input')).toHaveValue('');
    expect(screen.queryByText('Notification Name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'add author' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  test('validates author names with the component regex and enables add for valid input', async () => {
    const { user } = render(<CitationForm onClose={vi.fn()} template="authors" />);

    const input = screen.getByLabelText('new author input');
    const addButton = screen.getByRole('button', { name: 'add author' });

    await user.type(input, 'Jane Doe');
    expect(screen.getByText('Invalid')).toBeInTheDocument();
    expect(addButton).toBeDisabled();

    await user.clear(input);
    await user.type(input, 'Doe, Jane');

    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(addButton).toBeEnabled();
  });

  test('accepts canonical ORCID ids and rejects invalid ones', async () => {
    const validOrcid = '0000-0002-1825-0097';
    const invalidOrcid = '0000-0002-1825-009';

    expect(isValidOrcidId(validOrcid)).toBe(true);
    expect(isValidOrcidId(invalidOrcid)).toBe(false);

    const { user } = render(<CitationForm onClose={vi.fn()} template="citations" />);

    const input = screen.getByLabelText('new author input');
    const addButton = screen.getByRole('button', { name: 'add author' });

    await user.type(input, validOrcid);
    expect(screen.getByText('Orcid')).toBeInTheDocument();
    expect(addButton).toBeEnabled();

    await user.clear(input);
    await user.type(input, invalidOrcid);

    expect(screen.getByText('Invalid')).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  test('submits a new citation notification with serialized authors', async () => {
    const { user } = render(<CitationForm onClose={vi.fn()} onUpdated={vi.fn()} template="citations" />);

    const input = screen.getByLabelText('new author input');

    await user.type(input, 'Doe, Jane');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());

    await user.type(input, '0000-0002-1825-0097');
    await user.click(screen.getByRole('button', { name: 'add author' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(addNotificationMock).toHaveBeenCalledTimes(1);
    expect(addNotificationMock).toHaveBeenCalledWith(
      {
        data: 'author:"Doe, Jane" OR orcid:"0000-0002-1825-0097"',
        template: 'citations',
        type: 'template',
      },
      expect.objectContaining({
        onSettled: expect.any(Function),
      }),
    );
    expect(editNotificationMock).not.toHaveBeenCalled();
  });

  test('renders edit mode name and submits existing authors with updated name', async () => {
    const notification = {
      id: 42,
      name: 'Original Name',
      data: 'author:"Doe, Jane" OR orcid:"0000-0002-1825-0097"',
    };

    const { user } = render(<CitationForm onClose={vi.fn()} notification={notification as never} />);

    const nameInput = screen.getByDisplayValue('Original Name');
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(editNotificationMock).toHaveBeenCalledTimes(1);
    expect(editNotificationMock).toHaveBeenCalledWith(
      {
        id: 42,
        data: 'author:"Doe, Jane" OR orcid:"0000-0002-1825-0097"',
        name: 'Updated Name',
      },
      expect.objectContaining({
        onSettled: expect.any(Function),
      }),
    );
    expect(addNotificationMock).not.toHaveBeenCalled();
  });
});
