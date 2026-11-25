import { render } from '@/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { IDocsEntity } from '@/api/search/types';

const scrollToIndex = vi.fn();

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: () => ({
    getTotalSize: (): number => 1000,
    getVirtualItems: (): unknown[] => [],
    measureElement: (): void => undefined,
    scrollToIndex,
  }),
}));

import { VirtualResultRows } from './VirtualResultRows';

const docsFor = (count: number): IDocsEntity[] =>
  Array.from({ length: count }, (_, i) => ({ bibcode: `bib-${i}` } as IDocsEntity));

const renderRows = (count = 500) =>
  render(<VirtualResultRows docs={docsFor(count)} renderRow={(doc) => <div>{doc.bibcode}</div>} />);

const saveRowIndex = (index: number, search: string) =>
  sessionStorage.setItem('search-scroll-row-index', JSON.stringify({ index, search }));

beforeEach(() => {
  scrollToIndex.mockClear();
  sessionStorage.clear();
  window.history.pushState({}, '', '/search?q=star');
});

test('restores to the row index saved for this search', () => {
  saveRowIndex(200, 'q=star');

  renderRows();

  expect(scrollToIndex).toHaveBeenCalledWith(200, { align: 'start' });
});

test('consumes the saved index once, so a re-render does not scroll again', () => {
  saveRowIndex(200, 'q=star');

  const { rerender } = renderRows();
  rerender(<VirtualResultRows docs={docsFor(500)} renderRow={(doc) => <div>{doc.bibcode}</div>} />);

  expect(scrollToIndex).toHaveBeenCalledTimes(1);
  expect(sessionStorage.getItem('search-scroll-row-index')).toBeNull();
});

test('ignores an index saved under a different query', () => {
  saveRowIndex(200, 'q=quasar');

  renderRows();

  expect(scrollToIndex).not.toHaveBeenCalled();
});

test('a reference list on an abstract page does not consume the search index', () => {
  saveRowIndex(200, 'q=star');
  window.history.pushState({}, '', '/abs/2020arXiv/references');

  renderRows();

  expect(scrollToIndex).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('search-scroll-row-index')).not.toBeNull();
});

test('an index beyond the end of the page is not applied', () => {
  saveRowIndex(900, 'q=star');

  renderRows(500);

  expect(scrollToIndex).not.toHaveBeenCalled();
});

test('an empty page waits rather than consuming the index', () => {
  saveRowIndex(200, 'q=star');

  renderRows(0);

  expect(scrollToIndex).not.toHaveBeenCalled();
  expect(sessionStorage.getItem('search-scroll-row-index')).not.toBeNull();
});
