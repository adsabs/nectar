import { render } from '@/test-utils';
import { describe, expect, test, vi } from 'vitest';
import { DocumentItem } from './DocumentItem';
import { IDocsEntity } from '@/api/search/types';

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    query: {},
    asPath: '/',
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  })),
}));

vi.mock('next/router', () => ({ useRouter: mocks.useRouter }));

const makeDoc = (overrides?: Partial<IDocsEntity>): IDocsEntity =>
  ({
    bibcode: '2020ApJ...123..456A',
    title: ['Test Paper'],
    author: ['Author, A.'],
    pubdate: '2020-01-00',
    ...overrides,
  } as unknown as IDocsEntity);

const baseProps = {
  library: 'abc123',
  canEdit: false,
  showNote: false,
  onNoteUpdate: vi.fn(),
  index: 1,
  hideCheckbox: true,
  hideResources: true,
  defaultCitation: '',
};

describe('DocumentItem', () => {
  test('title link carries the referrer when one is provided', () => {
    const { getByText } = render(<DocumentItem {...baseProps} doc={makeDoc()} referrer="/user/libraries/abc123" />);

    const link = getByText('Test Paper').closest('a');
    expect(link).toHaveAttribute('href', '/abs/2020ApJ...123..456A/abstract?referrer=%2Fuser%2Flibraries%2Fabc123');
  });

  test('title link has no referrer query when none is provided', () => {
    const { getByText } = render(<DocumentItem {...baseProps} doc={makeDoc()} />);

    const link = getByText('Test Paper').closest('a');
    expect(link).toHaveAttribute('href', '/abs/2020ApJ...123..456A/abstract');
  });
});
