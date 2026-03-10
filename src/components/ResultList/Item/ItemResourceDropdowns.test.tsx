import { render, waitFor } from '@/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ItemResourceDropdowns } from './ItemResourceDropdowns';
import { IDocsEntity } from '@/api/search/types';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: {},
    asPath: '/',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
  useSettings: vi.fn(() => ({
    settings: { defaultCitationFormat: 'agu' },
  })),
  useGetExportCitation: vi.fn(() => ({ data: undefined as { export: string } | undefined })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
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
  afterEach(() => {
    mocks.useGetExportCitation.mockClear();
    mocks.useGetExportCitation.mockReturnValue({ data: undefined });
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
