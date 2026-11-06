import { render, within } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IDocsEntity } from '@/api/search/types';
import { DEFAULT_USER_DATA } from '@/api/user/models';
import { DEFAULT_EXPORT_FORMATS } from '@/components/CitationExporter/models';
import { AppMode } from '@/types';

import { AbstractDetails } from './AbstractDetails';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: {},
    asPath: '/abs/2003NanoL...3..459S',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
  useSession: vi.fn(() => ({ isAuthenticated: false })),
  useSettings: vi.fn(() => ({
    settings: DEFAULT_USER_DATA,
    getSettingsState: { isPlaceholderData: false },
  })),
  useGetExportCitation: vi.fn(() => ({ data: undefined, isLoading: true, isError: false })),
  useGetExportFormats: vi.fn(() => ({ data: DEFAULT_EXPORT_FORMATS })),
  toast: vi.fn(),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useSession', () => ({ useSession: mocks.useSession }));
vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));

vi.mock('@/api/export/export', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/export/export')>();
  return {
    ...actual,
    useGetExportCitation: mocks.useGetExportCitation,
    useGetExportFormats: mocks.useGetExportFormats,
  };
});

vi.mock('@chakra-ui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@chakra-ui/react')>();
  return { ...actual, useToast: () => mocks.toast };
});

const makeDoc = (overrides?: Partial<IDocsEntity>): IDocsEntity =>
  ({
    bibcode: '2003NanoL...3..459S',
    pub_raw: 'Nano Letters, Volume 3, Issue 4, pp. 459-463',
    pubdate: '2003-04-00',
    ...overrides,
  } as unknown as IDocsEntity);

const renderDetails = (doc = makeDoc()) =>
  render(<AbstractDetails doc={doc} />, { initialStore: { mode: AppMode.ASTROPHYSICS } });

beforeEach(() => {
  mocks.toast.mockClear();
  mocks.useSession.mockReturnValue({ isAuthenticated: false });
});

describe('AbstractDetails citation control (criterion 1)', () => {
  it('renders two citation segments with distinct accessible names', () => {
    const { getByRole } = renderDetails();

    expect(getByRole('button', { name: 'Copy citation (BibTeX)' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Change citation format' })).toBeInTheDocument();
  });

  it('groups both segments together as one control', () => {
    const { getByRole } = renderDetails();

    const group = getByRole('group', { name: /citation/i });
    const buttons = within(group).getAllByRole('button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName('Copy citation (BibTeX)');
    expect(buttons[1]).toHaveAccessibleName('Change citation format');
  });

  it('replaces the old single quote-icon button', () => {
    const { queryByRole } = renderDetails();

    expect(queryByRole('button', { name: 'Copy citation' })).not.toBeInTheDocument();
  });

  it('renders the control inside the publication row', () => {
    const { container, getByRole } = renderDetails();

    const publicationRow = container.querySelector('#publication');
    expect(publicationRow).not.toBeNull();
    expect(publicationRow).toContainElement(getByRole('button', { name: 'Copy citation (BibTeX)' }));
  });

  it('names the segment after the resolved format rather than a fixed label', () => {
    const { getByRole } = render(<AbstractDetails doc={makeDoc()} />, {
      initialStore: { mode: AppMode.PLANET_SCIENCE },
    });

    expect(getByRole('button', { name: 'Copy citation (Icarus)' })).toBeInTheDocument();
  });
});

describe('AbstractDetails tour anchor (criterion 11)', () => {
  it('carries exactly one quick-citation-copy anchor', () => {
    const { container } = renderDetails();

    expect(container.querySelectorAll('[data-tour="quick-citation-copy"]')).toHaveLength(1);
  });

  it('anchors the tour step to the copy segment, not the chevron', () => {
    const { container, getByRole } = renderDetails();

    const anchor = container.querySelector('[data-tour="quick-citation-copy"]');

    expect(anchor).toBe(getByRole('button', { name: 'Copy citation (BibTeX)' }));
  });

  it('keeps the anchor discoverable by the selector the tour uses', () => {
    renderDetails();

    expect(document.querySelector('[data-tour="quick-citation-copy"]')).not.toBeNull();
  });
});
