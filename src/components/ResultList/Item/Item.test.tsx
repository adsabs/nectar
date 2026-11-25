import { render, waitFor } from '@/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Item } from './Item';
import { IDocsEntity } from '@/api/search/types';
import { IADSApiUserDataResponse } from '@/api/user/types';

const SCROLL_POSITION_KEY = 'search-scroll-position';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    pathname: '/search',
    query: {},
    asPath: '/search?q=star',
    push: vi.fn(),
    prefetch: vi.fn(() => Promise.resolve()),
    events: { on: vi.fn(), off: vi.fn() },
  })),
  useSettings: vi.fn((): { settings: Partial<IADSApiUserDataResponse> } => ({ settings: {} })),
  useCitationFormat: vi.fn(),
  useGetExportCitation: vi.fn(() => ({ data: undefined as { export: string } | undefined })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/lib/useCitationFormat', () => ({ useCitationFormat: mocks.useCitationFormat }));
vi.mock('@/api/export/export', () => ({ useGetExportCitation: mocks.useGetExportCitation }));

const makeDoc = (bibcode: string): IDocsEntity =>
  ({
    bibcode,
    title: [`Title ${bibcode}`],
    author: ['Author, A.'],
    pubdate: '2020-01-00',
    citation_count: 0,
    reference_count: 0,
    esources: [],
    property: [],
  } as unknown as IDocsEntity);

const BIBCODES = ['2020ApJ...900..1A', '2020ApJ...900..2B', '2020ApJ...900..3C'];

const renderRows = () =>
  render(
    <>
      {BIBCODES.map((bibcode, index) => (
        <Item key={bibcode} doc={makeDoc(bibcode)} index={index} hideCheckbox={false} hideActions={false} />
      ))}
    </>,
  );

describe('Item', () => {
  let scrollTo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mocks.useSettings.mockReturnValue({ settings: {} });
    mocks.useGetExportCitation.mockReturnValue({ data: undefined });
    mocks.useCitationFormat.mockReturnValue({
      format: { id: 'agu', name: 'AGU', asHtml: true, isInModal: true },
      isReady: true,
      resolveWithSettings: vi.fn(),
    });
    sessionStorage.clear();
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    scrollTo.mockRestore();
    sessionStorage.clear();
  });

  describe('scroll restoration belongs to the page, not the row (criterion 5)', () => {
    test('rendering rows with a saved position does not restore scroll', async () => {
      sessionStorage.setItem(SCROLL_POSITION_KEY, '1234');

      const { getByText } = renderRows();

      for (const bibcode of BIBCODES) {
        expect(getByText(`Title ${bibcode}`)).toBeInTheDocument();
      }

      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(scrollTo).not.toHaveBeenCalled();
      expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBe('1234');
    });

    test('clicking a result still saves the scroll position', async () => {
      Object.defineProperty(window, 'scrollY', { value: 987, configurable: true });

      const { user, getByText } = renderRows();

      await user.click(getByText(`Title ${BIBCODES[0]}`));

      await waitFor(() => {
        expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBe('987');
      });
    });
  });
});
