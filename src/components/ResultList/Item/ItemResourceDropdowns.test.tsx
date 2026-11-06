import { render, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, it, test, vi } from 'vitest';
import { ItemResourceDropdowns } from './ItemResourceDropdowns';
import { IDocsEntity } from '@/api/search/types';
import { IADSApiUserDataResponse, JournalFormatName } from '@/api/user/types';
import { ExportApiJournalFormat } from '@/api/export/types';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: {},
    asPath: '/',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
  useSettings: vi.fn((): { settings: Partial<IADSApiUserDataResponse> } => ({ settings: {} })),
  useCitationFormat: vi.fn(),
  copyMenuItem: vi.fn(),
  useGetExportCitation: vi.fn(() => ({ data: undefined as { export: string } | undefined })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/lib/useCitationFormat', () => ({ useCitationFormat: mocks.useCitationFormat }));
vi.mock('@/components/CopyButton', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/CopyButton')>();
  return {
    ...actual,
    CopyMenuItem: (props: { label: string; text: string; asHtml?: boolean; isDisabled?: boolean }) => {
      mocks.copyMenuItem(props);
      return <button disabled={props.isDisabled}>{props.label}</button>;
    },
  };
});
vi.mock('@/api/export/export', () => ({
  useGetExportCitation: mocks.useGetExportCitation,
}));

const makeDoc = (overrides?: Partial<IDocsEntity>): IDocsEntity =>
  ({
    bibcode: '2020ApJ...123..456A',
    title: ['Test Paper'],
    author: ['Author, A.'],
    pubdate: '2020-01-00',
    citation_count: 0,
    reference_count: 0,
    esources: [],
    property: [],
    ...overrides,
  } as unknown as IDocsEntity);

describe('ItemResourceDropdowns', () => {
  beforeEach(() => {
    mocks.useGetExportCitation.mockClear();
    mocks.useGetExportCitation.mockReturnValue({ data: undefined });
    mocks.useSettings.mockReturnValue({ settings: {} });
    mocks.copyMenuItem.mockClear();
    mocks.useCitationFormat.mockReturnValue({
      format: { id: 'agu', name: 'AGU', asHtml: true, isInModal: true },
      isReady: true,
      resolveWithSettings: vi.fn(),
    });
  });

  test('does not fetch citation on mount', () => {
    render(<ItemResourceDropdowns doc={makeDoc()} />);

    // The hook should be called with enabled: false on initial render
    // because isShareOpen starts as false
    expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'agu',
        bibcode: ['2020ApJ...123..456A'],
      }),
      expect.objectContaining({ enabled: false }),
    );
  });

  test('fetches citation when share menu is opened', async () => {
    const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

    mocks.useGetExportCitation.mockClear();

    const shareButton = getByLabelText('share options');
    await user.click(shareButton);

    // After opening the share menu, the hook should be called
    // with enabled: true
    await waitFor(() => {
      expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'agu',
          bibcode: ['2020ApJ...123..456A'],
        }),
        expect.objectContaining({ enabled: true }),
      );
    });
  });

  test('uses citation data from hook in CopyMenuItem', async () => {
    mocks.useGetExportCitation.mockReturnValue({
      data: { export: 'Author, A. (2020). Test Paper.' },
    });

    const { getByLabelText, user, getByText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

    const shareButton = getByLabelText('share options');
    await user.click(shareButton);

    // The Copy Citation menu item should be visible
    expect(getByText('Copy Citation')).toBeInTheDocument();
  });

  test('renders share options button', () => {
    const { getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

    expect(getByLabelText('share options')).toBeInTheDocument();
  });

  test('includes custom bibtex keyformat when the resolved format is bibtex', async () => {
    mocks.useCitationFormat.mockReturnValue({
      format: { id: 'bibtex', name: 'BibTeX', asHtml: false, isInModal: true },
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

    const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

    await user.click(getByLabelText('share options'));

    await waitFor(() => {
      expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'bibtex',
          keyformat: ['%1H+%Y'],
          journalformat: [ExportApiJournalFormat.AASTeXMacros],
          authorcutoff: [200],
          maxauthor: [10],
        }),
        expect.objectContaining({ enabled: true }),
      );
    });
  });

  test('does not send bibtex params when the resolved format is not bibtex', async () => {
    const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

    await user.click(getByLabelText('share options'));

    await waitFor(() => {
      expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
        expect.not.objectContaining({ keyformat: expect.anything() }),
        expect.objectContaining({ enabled: true }),
      );
    });
  });

  describe('copy flavour follows the resolved format (criterion 9)', () => {
    const withFormat = (format: { id: string; name: string; asHtml: boolean }) => {
      mocks.useCitationFormat.mockReturnValue({
        format: { ...format, isInModal: true },
        isReady: true,
        resolveWithSettings: vi.fn(),
      });
      mocks.useGetExportCitation.mockReturnValue({ data: { export: 'Author, A. (2020).' } });
    };

    const copyProps = () => mocks.copyMenuItem.mock.calls.at(-1)?.[0] as { asHtml?: boolean; text?: string };

    it.each([
      { id: 'agu', name: 'AGU', asHtml: true },
      { id: 'ieee', name: 'IEEE', asHtml: true },
      { id: 'apsj', name: 'APS Journals', asHtml: true },
      { id: 'bibtex', name: 'BibTeX', asHtml: false },
      { id: 'icarus', name: 'Icarus', asHtml: false },
      { id: 'ris', name: 'RIS', asHtml: false },
    ])('copies $name as html=$asHtml', async ({ id, name, asHtml }) => {
      withFormat({ id, name, asHtml });
      const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

      await user.click(getByLabelText('share options'));

      await waitFor(() => expect(copyProps()).toBeDefined());
      expect(copyProps().asHtml).toBe(asHtml);
    });

    test('requests the resolved format rather than a fixed one', async () => {
      withFormat({ id: 'apsj', name: 'APS Journals', asHtml: true });
      const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

      await user.click(getByLabelText('share options'));

      await waitFor(() => {
        expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
          expect.objectContaining({ format: 'apsj' }),
          expect.objectContaining({ enabled: true }),
        );
      });
    });

    test('carries a saved custom template into the request', async () => {
      mocks.useCitationFormat.mockReturnValue({
        format: {
          id: 'custom',
          name: 'My Format',
          asHtml: false,
          isInModal: false,
          customFormat: '%1H:%Y:%q',
          customFormatId: 'format-abc',
        },
        isReady: true,
        resolveWithSettings: vi.fn(),
      });
      mocks.useGetExportCitation.mockReturnValue({ data: { export: 'Star:2003:NanoL' } });
      const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

      await user.click(getByLabelText('share options'));

      await waitFor(() => {
        expect(mocks.useGetExportCitation).toHaveBeenCalledWith(
          expect.objectContaining({ format: 'custom', customFormat: '%1H:%Y:%q' }),
          expect.objectContaining({ enabled: true }),
        );
      });
    });
  });

  describe('an empty citation is not offered for copying', () => {
    test('disables the copy item while there is no citation yet', async () => {
      mocks.useGetExportCitation.mockReturnValue({ data: undefined });
      const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

      await user.click(getByLabelText('share options'));

      await waitFor(() => expect(mocks.copyMenuItem).toHaveBeenCalled());
      const props = mocks.copyMenuItem.mock.calls.at(-1)?.[0] as { isDisabled?: boolean; text?: string };
      expect(props.text).toBe('');
      expect(props.isDisabled).toBe(true);
    });

    test('enables the copy item once the citation arrives', async () => {
      mocks.useGetExportCitation.mockReturnValue({ data: { export: 'Author, A. (2020).' } });
      const { user, getByLabelText } = render(<ItemResourceDropdowns doc={makeDoc()} />);

      await user.click(getByLabelText('share options'));

      await waitFor(() => expect(mocks.copyMenuItem).toHaveBeenCalled());
      const props = mocks.copyMenuItem.mock.calls.at(-1)?.[0] as { isDisabled?: boolean; text?: string };
      expect(props.text).toBe('Author, A. (2020).');
      expect(props.isDisabled).toBe(false);
    });
  });

  describe('tooltip dismissal when menu opens', () => {
    const docWithSources = makeDoc({
      esources: ['PUB_PDF', 'EPRINT_PDF'],
      property: ['ESOURCE'],
      reference_count: 5,
      citation_count: 10,
    });

    test('dismisses tooltip when menu opens via click', async () => {
      const { user, getByRole, findByRole, queryByRole } = render(<ItemResourceDropdowns doc={docWithSources} />);

      const button = getByRole('button', {
        name: 'Full text sources',
      });

      // hover to show tooltip
      await user.hover(button);
      const tooltip = await findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();

      // click to open menu — tooltip should disappear
      await user.click(button);

      await waitFor(() => {
        expect(queryByRole('tooltip')).not.toBeInTheDocument();
      });

      // menu should be open
      expect(getByRole('menu')).toBeInTheDocument();
    });

    test('after closing the menu, hovering again restores tooltip', async () => {
      const { user, getByRole, findByRole, queryByRole } = render(<ItemResourceDropdowns doc={docWithSources} />);

      const button = getByRole('button', {
        name: 'Full text sources',
      });

      // open menu via click
      await user.hover(button);
      await findByRole('tooltip');
      await user.click(button);

      // wait for menu to appear
      await findByRole('menu');

      // close the menu by pressing Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(queryByRole('menu')).not.toBeInTheDocument();
      });

      // unhover then re-hover to trigger tooltip again
      await user.unhover(button);
      await user.hover(button);

      const tooltip = await findByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });

    test('opening the menu via keyboard (Enter) suppresses tooltip', async () => {
      const { user, getByRole, findByRole, queryByRole } = render(<ItemResourceDropdowns doc={docWithSources} />);

      const button = getByRole('button', {
        name: 'Full text sources',
      });

      // focus and hover to show tooltip
      await user.hover(button);
      await findByRole('tooltip');

      // open menu via keyboard
      button.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(queryByRole('tooltip')).not.toBeInTheDocument();
      });

      expect(getByRole('menu')).toBeInTheDocument();
    });

    test('opening the menu via keyboard (Space) suppresses tooltip', async () => {
      const { user, getByRole, findByRole, queryByRole } = render(<ItemResourceDropdowns doc={docWithSources} />);

      const button = getByRole('button', {
        name: 'Full text sources',
      });

      // focus and hover to show tooltip
      await user.hover(button);
      await findByRole('tooltip');

      // open menu via Space key
      button.focus();
      await user.keyboard('{ }');

      await waitFor(() => {
        expect(queryByRole('tooltip')).not.toBeInTheDocument();
      });

      expect(getByRole('menu')).toBeInTheDocument();
    });
  });
});
