import { render } from '@/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IDocsEntity } from '@/api/search/types';

import { DocumentList } from './DocumentList';

const mocks = vi.hoisted(() => ({
  useGetExportCitation: vi.fn(() => ({ data: undefined })),
  useSettings: vi.fn(() => ({ settings: {} })),
  documentItem: vi.fn(),
}));

vi.mock('@/lib/useSettings', () => ({ useSettings: mocks.useSettings }));
vi.mock('@/api/export/export', () => ({ useGetExportCitation: mocks.useGetExportCitation }));
vi.mock('./DocumentItem', () => ({
  DocumentItem: (props: Record<string, unknown>) => {
    mocks.documentItem(props);
    return <li>{String((props.doc as IDocsEntity)?.bibcode)}</li>;
  },
}));

const docs = [{ bibcode: '2003NanoL...3..459S' }, { bibcode: '2020ApJ...123..456A' }] as unknown as IDocsEntity[];

const renderList = () =>
  render(
    <DocumentList library="lib-1" docs={docs} showNotes={false} canEdit={false} onNoteUpdate={vi.fn()} hideCheckbox />,
  );

beforeEach(() => {
  mocks.useGetExportCitation.mockClear();
  mocks.documentItem.mockClear();
});

describe('DocumentList', () => {
  it('renders one item per document', () => {
    renderList();

    expect(mocks.documentItem).toHaveBeenCalledTimes(2);
  });

  it('requests no citations for the list (criterion 10)', () => {
    renderList();

    expect(mocks.useGetExportCitation).not.toHaveBeenCalled();
  });

  it('hands no citation down to its items', () => {
    renderList();

    mocks.documentItem.mock.calls.forEach(([props]) => {
      expect(props).not.toHaveProperty('defaultCitation');
    });
  });
});
