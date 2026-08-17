import { render } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { DocumentList } from './DocumentList';
import { IDocsEntity } from '@/api/search/types';

const mocks = vi.hoisted(() => ({
  DocumentItem: vi.fn(() => null),
  useGetExportCitation: vi.fn(() => ({ data: undefined })),
  useRouter: vi.fn(() => ({
    query: {},
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('./DocumentItem', () => ({ DocumentItem: mocks.DocumentItem }));
vi.mock('@/api/export/export', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/export/export')>()),
  useGetExportCitation: mocks.useGetExportCitation,
}));
vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

const doc = { bibcode: '2020ApJ...123..456A', title: ['Test Paper'] } as unknown as IDocsEntity;

const baseProps = {
  library: 'abc123',
  docs: [doc],
  showNotes: false,
  canEdit: false,
  onNoteUpdate: vi.fn(),
  hideCheckbox: true,
};

describe('DocumentList', () => {
  test('forwards referrer to each DocumentItem', () => {
    render(<DocumentList {...baseProps} referrer="/user/libraries/abc123" />);

    expect(mocks.DocumentItem).toHaveBeenCalledWith(
      expect.objectContaining({ referrer: '/user/libraries/abc123' }),
      expect.anything(),
    );
  });

  test('leaves referrer undefined when none is provided', () => {
    render(<DocumentList {...baseProps} />);

    expect(mocks.DocumentItem).toHaveBeenCalledWith(
      expect.objectContaining({ referrer: undefined }),
      expect.anything(),
    );
  });
});
