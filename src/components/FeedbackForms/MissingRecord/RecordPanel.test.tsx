import { render } from '@/test-utils';
import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { RecordPanel } from './RecordPanel';
import type { UserEvent } from '@testing-library/user-event';

// --- mocks ---

vi.mock('@/api/search/search', () => ({
  useGetSingleRecord: vi.fn(() => ({
    data: null as null,
    isFetching: false,
    isSuccess: false,
    error: null as null,
    refetch: vi.fn(),
  })),
}));

vi.mock('@/lib/useGetResourceLinks', async () => {
  const actual = await vi.importActual<typeof import('@/lib/useGetResourceLinks')>('@/lib/useGetResourceLinks');
  return {
    ...actual,
    useGetResourceLinks: vi.fn(() => ({
      data: [] as import('@/lib/useGetResourceLinks').IResourceUrl[],
      isSuccess: false,
      isFetching: false,
      refetch: vi.fn(),
    })),
  };
});

vi.mock('@/lib/useGetUserEmail', () => ({
  useGetUserEmail: vi.fn((): string | null => null),
}));

vi.mock('@/api/feedback/feedback', () => ({
  useFeedback: vi.fn(() => ({ mutate: vi.fn(), isLoading: false })),
}));

vi.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: vi.fn(() => ({ executeRecaptcha: vi.fn() })),
}));

// --- helpers ---

const defaultProps = {
  onOpenAlert: vi.fn(),
  onCloseAlert: vi.fn(),
  isFocused: false,
};

type QueryHelpers = Pick<ReturnType<typeof render>, 'getByLabelText' | 'getByRole' | 'getByText'>;

/**
 * Fill all required fields so the form becomes valid.
 * Uses the noAuthors checkbox instead of adding an author row.
 */
const fillRequiredFields = async (user: UserEvent, queries: QueryHelpers) => {
  const { getByLabelText, getByRole } = queries;
  await user.type(getByLabelText('Name*'), 'Jane Doe');
  await user.type(getByLabelText('Email*'), 'jane@example.com');
  await user.type(getByLabelText('Title*'), 'A Great Paper');
  await user.type(getByLabelText('Publication*'), 'Nature');
  await user.type(getByLabelText('Publication Date*'), '2024-01');
  await user.click(getByRole('checkbox', { name: /Abstract has no author/i }));
};

// --- tests ---

describe('RecordPanel — New Record mode (isNew=true)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders all required field labels', () => {
    const { getByLabelText } = render(<RecordPanel {...defaultProps} isNew={true} />);

    // Chakra appends '*' directly to the label text for required fields
    expect(getByLabelText('Name*')).toBeInTheDocument();
    expect(getByLabelText('Email*')).toBeInTheDocument();
    expect(getByLabelText('Title*')).toBeInTheDocument();
    expect(getByLabelText('Publication*')).toBeInTheDocument();
    expect(getByLabelText('Publication Date*')).toBeInTheDocument();
  });

  test('Preview button is disabled when form is empty', () => {
    const { getByRole } = render(<RecordPanel {...defaultProps} isNew={true} />);
    const previewBtn = getByRole('button', { name: /preview/i });
    expect(previewBtn).toBeDisabled();
  });

  test('Preview button becomes enabled when all required fields are filled', async () => {
    const result = render(<RecordPanel {...defaultProps} isNew={true} />);
    const { user, getByRole } = result;

    const previewBtn = getByRole('button', { name: /preview/i });
    expect(previewBtn).toBeDisabled();

    await fillRequiredFields(user, result);

    await waitFor(() => expect(previewBtn).not.toBeDisabled());
  });

  test('Preview button stays disabled when only some required fields are filled', async () => {
    // Verifies that all required fields must be filled — not just one.
    const result = render(<RecordPanel {...defaultProps} isNew={true} />);
    const { user, getByRole, getByLabelText } = result;

    const previewBtn = getByRole('button', { name: /preview/i });
    expect(previewBtn).toBeDisabled();

    // Fill everything except pubDate
    await user.type(getByLabelText('Name*'), 'Jane Doe');
    await user.type(getByLabelText('Email*'), 'jane@example.com');
    await user.type(getByLabelText('Title*'), 'A Great Paper');
    await user.type(getByLabelText('Publication*'), 'Nature');
    await user.click(getByRole('checkbox', { name: /Abstract has no author/i }));

    // Button should still be disabled — pubDate is missing
    await waitFor(() => expect(previewBtn).toBeDisabled());
  });

  test('noAuthors checkbox is visible when no authors have been added', () => {
    const { getByRole } = render(<RecordPanel {...defaultProps} isNew={true} />);
    expect(getByRole('checkbox', { name: /Abstract has no author/i })).toBeInTheDocument();
  });
});

describe('RecordPanel — Edit Record mode (isNew=false)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders bibcode input and Load button', () => {
    const { getByLabelText, getByRole } = render(<RecordPanel {...defaultProps} isNew={false} />);

    // In edit mode the label reads "SciX-ID / DOI / Bibcode"
    expect(getByLabelText(/SciX-ID \/ DOI \/ Bibcode/i)).toBeInTheDocument();
    expect(getByRole('button', { name: /load/i })).toBeInTheDocument();
  });

  test('Load button is disabled when bibcode field is empty', () => {
    const { getByRole } = render(<RecordPanel {...defaultProps} isNew={false} />);

    const loadBtn = getByRole('button', { name: /load/i });
    expect(loadBtn).toBeDisabled();
  });

  test('Load button becomes enabled when bibcode field has a value', async () => {
    const { user, getByRole, getByLabelText } = render(<RecordPanel {...defaultProps} isNew={false} />);

    const loadBtn = getByRole('button', { name: /load/i });
    expect(loadBtn).toBeDisabled();

    const bibcodeInput = getByLabelText(/SciX-ID \/ DOI \/ Bibcode/i);
    await user.type(bibcodeInput, '2024ApJ...123..456A');

    await waitFor(() => expect(loadBtn).not.toBeDisabled());
  });
});
