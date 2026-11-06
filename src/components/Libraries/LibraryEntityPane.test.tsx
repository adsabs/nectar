import { render, waitFor } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IADSApiLibraryEntityResponse } from '@/api/biblib/types';

import { LibraryEntityPane } from './LibraryEntityPane';

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  return {
    push,
    useRouter: vi.fn(() => ({
      query: {},
      asPath: '/user/libraries/lib-1',
      push,
      events: { on: vi.fn(), off: vi.fn() },
    })),
    useSettings: vi.fn(() => ({ settings: {} })),
    useCitationFormat: vi.fn(),
    useGetLibraryEntity: vi.fn(),
    useEditLibraryDocuments: vi.fn(() => ({ mutate: vi.fn() })),
    useBigQuerySearch: vi.fn(() => ({ mutate: vi.fn(), isLoading: false, error: null })),
    useVaultBigQuerySearch: vi.fn(() => ({ data: undefined })),
  };
});

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));
vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/lib/useCitationFormat', () => ({ useCitationFormat: mocks.useCitationFormat }));
vi.mock('@/api/biblib/libraries', () => ({
  useGetLibraryEntity: mocks.useGetLibraryEntity,
  useEditLibraryDocuments: mocks.useEditLibraryDocuments,
}));
vi.mock('@/api/search/search', () => ({ useBigQuerySearch: mocks.useBigQuerySearch }));
vi.mock('@/api/vault/vault', () => ({ useVaultBigQuerySearch: mocks.useVaultBigQuerySearch }));

const library = {
  metadata: {
    num_documents: 2,
    date_last_modified: '2020-01-02',
    permission: 'owner',
    description: 'A test library',
    public: false,
    num_users: 1,
    owner: 'tester',
    date_created: '2020-01-01',
    id: 'lib-1',
    name: 'Test Library',
  },
  solr: { response: { numFound: 2, start: 0, docs: [] } },
  library_notes: { notes: {} },
} as unknown as IADSApiLibraryEntityResponse;

beforeEach(() => {
  mocks.push.mockClear();
  mocks.useGetLibraryEntity.mockReset();
  mocks.useGetLibraryEntity.mockReturnValue({
    data: library,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  mocks.useCitationFormat.mockReturnValue({
    format: { id: 'icarus', name: 'Icarus', asHtml: false, isInModal: true },
    isReady: true,
    resolveWithSettings: vi.fn(),
  });
});

describe('LibraryEntityPane export menu (criterion 8)', () => {
  it('routes "Other Formats" using the resolved format id rather than a hardcoded bibtex', async () => {
    const { getByRole, user } = render(<LibraryEntityPane id="lib-1" publicView={false} />);

    await user.click(getByRole('button', { name: 'Export' }));
    await user.click(await waitFor(() => getByRole('menuitem', { name: 'Other Formats' })));

    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    const [, asArg] = mocks.push.mock.calls.at(-1) as [unknown, { pathname?: string }];
    expect(asArg.pathname).toBe('/search/exportcitation/icarus');
    expect(asArg.pathname).not.toContain('bibtex');
  });
});
