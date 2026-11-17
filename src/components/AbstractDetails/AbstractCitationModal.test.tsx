import { fireEvent, render, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AbstractCitationModal } from './AbstractCitationModal';
import { IADSApiUserDataResponse, JournalFormatName } from '@/api/user/types';
import { ExportApiJournalFormat, IExportApiParams } from '@/api/export/types';
import { ResolvedCitationFormat } from '@/lib/citationFormat';

const bibtexOption = { id: 'bibtex', value: 'bibtex', label: 'BibTeX', type: 'text', ext: 'bib', route: '/bibtex' };
const aguOption = { id: 'agu', value: 'agu', label: 'AGU', type: 'HTML', ext: 'agu', route: '/agu' };
const risOption = { id: 'ris', value: 'ris', label: 'RIS', type: 'tagged', ext: 'txt', route: '/ris' };
const apsjOption = { id: 'apsj', value: 'apsj', label: 'APS Journals', type: 'HTML', ext: 'rtf', route: '/apsj' };

const allOptions = [bibtexOption, aguOption, risOption, apsjOption];

const resolved = (overrides?: Partial<ResolvedCitationFormat>): ResolvedCitationFormat => ({
  id: 'agu',
  name: 'AGU',
  asHtml: true,
  isInModal: true,
  ...overrides,
});

interface CitationQueryResult {
  data: { export: string };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

const mocks = vi.hoisted(() => ({
  useSettings: vi.fn((): { settings: Partial<IADSApiUserDataResponse> } => ({ settings: {} })),
  useExportFormats: vi.fn(),
  useSession: vi.fn(() => ({ isAuthenticated: false })),
  useCitationFormat: vi.fn(),
  useGetExportCitation: vi.fn<(params: IExportApiParams, options?: { enabled?: boolean }) => CitationQueryResult>(),
}));

vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/lib/useExportFormats', () => ({ useExportFormats: mocks.useExportFormats }));
vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));
vi.mock('@/lib/useCitationFormat', () => ({ useCitationFormat: mocks.useCitationFormat }));
vi.mock('@/api/export/export', () => ({
  useGetExportCitation: mocks.useGetExportCitation,
}));

const requestedFormats = (): string[] =>
  mocks.useGetExportCitation.mock.calls.map((call) => String(call[0]?.format ?? ''));

describe('AbstractCitationModal', () => {
  beforeEach(() => {
    mocks.useGetExportCitation.mockReset();
    mocks.useGetExportCitation.mockReturnValue({
      data: { export: '' },
      isLoading: false,
      isError: false,
      error: null,
    });
    mocks.useSettings.mockReturnValue({ settings: {} });
    mocks.useSession.mockReturnValue({ isAuthenticated: false });
    mocks.useCitationFormat.mockReturnValue({
      format: resolved(),
      isReady: true,
      resolveWithSettings: vi.fn(),
    });
    mocks.useExportFormats.mockReturnValue({
      formatOptions: allOptions,
      getFormatOptionById: (id: string) => allOptions.find((o) => o.id === id),
    });
  });

  describe('preselects the resolved default format (criterion 5)', () => {
    test('requests the resolved format when the modal opens', async () => {
      mocks.useCitationFormat.mockReturnValue({
        format: resolved({ id: 'ris', name: 'RIS', asHtml: false }),
        isReady: true,
        resolveWithSettings: vi.fn(),
      });

      render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

      await waitFor(() => expect(requestedFormats()).toContain('ris'));
      expect(requestedFormats()).not.toContain('agu');
    });

    test('shows the resolved format in the format selector', async () => {
      mocks.useCitationFormat.mockReturnValue({
        format: resolved({ id: 'ris', name: 'RIS', asHtml: false }),
        isReady: true,
        resolveWithSettings: vi.fn(),
      });

      const { findByText } = render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

      expect(await findByText('RIS')).toBeInTheDocument();
    });

    test('requests bibtex when that is the resolved format', async () => {
      mocks.useCitationFormat.mockReturnValue({
        format: resolved({ id: 'bibtex', name: 'BibTeX', asHtml: false }),
        isReady: true,
        resolveWithSettings: vi.fn(),
      });

      render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

      await waitFor(() => expect(requestedFormats()).toContain('bibtex'));
    });

    test('falls back to AGU when the resolved format is not one the modal can show', async () => {
      mocks.useCitationFormat.mockReturnValue({
        format: resolved({ id: 'apsj', name: 'APS Journals', isInModal: false }),
        isReady: true,
        resolveWithSettings: vi.fn(),
      });

      render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

      await waitFor(() => expect(requestedFormats()).toContain('agu'));
      expect(requestedFormats()).not.toContain('apsj');
    });

    test('keeps a format the reader picks instead of snapping back to the default', async () => {
      const { findByRole, user } = render(
        <AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />,
      );

      await waitFor(() => expect(requestedFormats()).toContain('agu'));

      const selector = await findByRole('combobox', { name: 'Format' });
      selector.focus();
      await user.type(selector, '{arrowdown}{enter}');

      await waitFor(() => expect(requestedFormats()).toContain('ris'));
      expect(requestedFormats().at(-1)).toBe('ris');
    });

    test('still shows the reader’s pick after the renders settle', async () => {
      const { findByRole, user } = render(
        <AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />,
      );

      const selector = await findByRole('combobox', { name: 'Format' });
      selector.focus();
      await user.type(selector, '{arrowdown}{enter}');

      await waitFor(() => expect(requestedFormats()).toContain('ris'));
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(requestedFormats().at(-1)).toBe('ris');
    });

    test('does not request anything while the modal is closed', () => {
      render(<AbstractCitationModal isOpen={false} onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

      expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ enabled: false }),
      );
    });

    test('links "More export options" to the resolved format, not a hardcoded default (criterion 8)', async () => {
      mocks.useCitationFormat.mockReturnValue({
        format: resolved({ id: 'ris', name: 'RIS', asHtml: false }),
        isReady: true,
        resolveWithSettings: vi.fn(),
      });

      const { findByRole } = render(<AbstractCitationModal isOpen onClose={vi.fn()} bibcode="2020ApJ...123..456A" />);

      const link = await findByRole('link', { name: /more export options/i });
      expect(link.getAttribute('href')).toMatch(/\/exportcitation\/ris$/);
    });
  });

  test('includes custom bibtex params when the resolved format is bibtex', async () => {
    mocks.useCitationFormat.mockReturnValue({
      format: resolved({ id: 'bibtex', name: 'BibTeX', asHtml: false }),
      isReady: true,
      resolveWithSettings: vi.fn(),
    });
    mocks.useSettings.mockReturnValue({
      settings: {
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
    mocks.useCitationFormat.mockReturnValue({
      format: resolved({ id: 'bibtex', name: 'BibTeX', asHtml: false }),
      isReady: true,
      resolveWithSettings: vi.fn(),
    });
    mocks.useSettings.mockReturnValue({
      settings: {
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

    expect(mocks.useGetExportCitation.mock.calls.at(-1)?.[0]).not.toHaveProperty('keyformat');
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

    expect(getByRole('link', { name: /copy citation settings/i })).toHaveAttribute('href', '/user/settings/export');
  });
});
