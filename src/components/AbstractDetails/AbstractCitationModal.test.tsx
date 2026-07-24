import { fireEvent, render, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AbstractCitationModal } from './AbstractCitationModal';
import { IADSApiUserDataResponse, JournalFormatName } from '@/api/user/types';
import { ExportApiJournalFormat, IExportApiParams } from '@/api/export/types';

const bibtexOption = { id: 'bibtex', value: 'bibtex', label: 'BibTeX', type: 'text', ext: 'bib', route: '/bibtex' };
const aguOption = { id: 'agu', value: 'agu', label: 'AGU', type: 'text', ext: 'agu', route: '/agu' };

const mocks = vi.hoisted(() => ({
  useSettings: vi.fn((): { settings: Partial<IADSApiUserDataResponse> } => ({
    settings: { defaultCitationFormat: 'agu' },
  })),
  useExportFormats: vi.fn(),
  useSession: vi.fn(() => ({ isAuthenticated: false })),
  useGetExportCitation: vi.fn(() => ({
    data: { export: '' },
    isLoading: false,
    isError: false,
    error: null as Error | null,
  })),
}));

vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/lib/useExportFormats', () => ({ useExportFormats: mocks.useExportFormats }));
vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));
vi.mock('@/api/export/export', () => ({
  useGetExportCitation: mocks.useGetExportCitation,
}));

describe('AbstractCitationModal', () => {
  beforeEach(() => {
    mocks.useGetExportCitation.mockClear();
    mocks.useSettings.mockReturnValue({ settings: { defaultCitationFormat: 'agu' } });
    mocks.useSession.mockReturnValue({ isAuthenticated: false });
    mocks.useExportFormats.mockReturnValue({
      formatOptions: [bibtexOption, aguOption],
      getFormatOptionById: (id: string) => [bibtexOption, aguOption].find((o) => o.id === id),
    });
  });

  test('includes custom bibtex params for a logged-in user when the default format is bibtex', async () => {
    mocks.useSettings.mockReturnValue({
      settings: {
        defaultCitationFormat: 'bibtex',
        bibtexKeyFormat: '%1H+%Y',
        bibtexABSKeyFormat: '%R',
        bibtexJournalFormat: JournalFormatName.AASTeXMacros,
        bibtexAuthorCutoff: '200',
        bibtexABSAuthorCutoff: '200',
        bibtexMaxAuthors: '10',
        bibtexABSMaxAuthors: '10',
      },
    });

    render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

    await waitFor(() => {
      expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'bibtex',
          bibcode: ['2020ApJ...123..456A'],
          keyformat: ['%1H+%Y'],
          journalformat: [ExportApiJournalFormat.AASTeXMacros],
          authorcutoff: [200],
          maxauthor: [10],
        }),
        expect.objectContaining({ enabled: true }),
      );
    });
  });

  test('passes an empty keyformat through when bibtex settings are unset', async () => {
    mocks.useSettings.mockReturnValue({
      settings: {
        defaultCitationFormat: 'bibtex',
        bibtexKeyFormat: '',
        bibtexABSKeyFormat: '',
        bibtexJournalFormat: JournalFormatName.AASTeXMacros,
        bibtexAuthorCutoff: '200',
        bibtexABSAuthorCutoff: '200',
        bibtexMaxAuthors: '10',
        bibtexABSMaxAuthors: '10',
      },
    });

    render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

    await waitFor(() => {
      expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'bibtex',
          keyformat: [''],
        }),
        expect.objectContaining({ enabled: true }),
      );
    });
  });

  test('does not send bibtex-only params for the real anonymous-user default format (agu)', async () => {
    render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

    await waitFor(() => {
      expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'agu' }),
        expect.objectContaining({ enabled: true }),
      );
    });

    const lastCall = mocks.useGetExportCitation.mock.calls.at(-1) as unknown as [IExportApiParams, unknown] | undefined;
    expect(lastCall?.[0]).not.toHaveProperty('keyformat');
  });

  test('disables the citation format settings button for an anonymous user', async () => {
    const { getByRole, queryByRole, user, findByRole } = render(
      <AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />,
    );

    const settingsButton = getByRole('button', { name: /copy citation settings/i });
    expect(settingsButton).toBeDisabled();
    expect(queryByRole('link', { name: /copy citation settings/i })).not.toBeInTheDocument();

    await user.hover(settingsButton);
    expect(await findByRole('tooltip')).toHaveTextContent('Create an account to manage Copy Citation settings');
  });

  test('surfaces the citation format settings tooltip on keyboard focus for an anonymous user', async () => {
    const { getByText, findByRole } = render(
      <AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />,
    );

    const focusableWrapper = getByText('Copy citation settings').closest('span[tabindex="0"]');
    expect(focusableWrapper).not.toBeNull();

    fireEvent.focus(focusableWrapper);
    expect(await findByRole('tooltip')).toHaveTextContent('Create an account to manage Copy Citation settings');
  });

  test('enables the citation format settings link for a logged-in user', () => {
    mocks.useSession.mockReturnValue({ isAuthenticated: true });

    const { getByRole } = render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

    expect(getByRole('link', { name: /copy citation settings/i })).toHaveAttribute(
      'href',
      '/user/settings/export?tab=3',
    );
  });
});
