import { act, render } from '@/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { IDocsEntity } from '@/api/search/types';
import { VIRTUALIZE_ABOVE_ROWS } from '@/config';

vi.mock('./Item', () => ({
  Item: ({ doc }: { doc: IDocsEntity }) => <div data-testid="result-item">{doc.bibcode}</div>,
}));

vi.mock('./useHighlights', () => ({
  useHighlights: () => ({
    highlights: [] as Record<string, string[]>[],
    showHighlights: false,
    isFetchingHighlights: false,
  }),
}));

vi.mock('./useAbstracts', () => ({
  useAbstracts: () => ({ abstracts: {} as Record<string, string>, isFetchingAbstracts: false }),
}));

import { SimpleResultList } from './SimpleResultList';

const ROW_HEIGHT = 150;

const docsFor = (count: number): IDocsEntity[] =>
  Array.from({ length: count }, (_, i) => ({ bibcode: `bib-${i}`, title: [`Title ${i}`] } as IDocsEntity));

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  window.scrollTo = (() => undefined) as typeof window.scrollTo;

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.hasAttribute('data-index') ? ROW_HEIGHT : 0;
    },
  });
});

afterEach(() => {
  if (originalOffsetHeight) {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
  } else {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight;
  }
});

test('a page larger than the threshold mounts only a window of rows', () => {
  const { queryAllByTestId } = render(<SimpleResultList docs={docsFor(500)} />);

  const mounted = queryAllByTestId('result-item');
  expect(mounted.length).toBeGreaterThan(0);
  expect(mounted.length).toBeLessThan(50);
});

test('the mounted window tracks the viewport, not the result count', () => {
  const mountedFor = (count: number) => {
    const { container, unmount } = render(<SimpleResultList docs={docsFor(count)} />);
    const mounted = container.querySelectorAll('[data-testid="result-item"]').length;
    unmount();
    return mounted;
  };

  expect(mountedFor(5000)).toBe(mountedFor(500));
});

test('the scroller reserves height for every row, so the scrollbar spans the page', () => {
  const { container } = render(<SimpleResultList docs={docsFor(500)} />);

  const scroller = container.querySelector('#results > div') as HTMLElement;
  expect(scroller).not.toBeNull();
  expect(parseInt(scroller.style.height, 10)).toBeGreaterThan(400 * ROW_HEIGHT);
});

test('a page at the threshold still renders every row', () => {
  const { queryAllByTestId } = render(<SimpleResultList docs={docsFor(VIRTUALIZE_ABOVE_ROWS)} />);

  expect(queryAllByTestId('result-item')).toHaveLength(VIRTUALIZE_ABOVE_ROWS);
});

test('printing puts every row in the document', () => {
  const { queryAllByTestId } = render(<SimpleResultList docs={docsFor(150)} />);
  expect(queryAllByTestId('result-item').length).toBeLessThan(150);

  act(() => {
    window.dispatchEvent(new Event('beforeprint'));
  });

  expect(queryAllByTestId('result-item')).toHaveLength(150);
});

test('the window comes back once printing ends', () => {
  const { queryAllByTestId } = render(<SimpleResultList docs={docsFor(150)} />);

  act(() => {
    window.dispatchEvent(new Event('beforeprint'));
  });
  expect(queryAllByTestId('result-item')).toHaveLength(150);

  act(() => {
    window.dispatchEvent(new Event('afterprint'));
  });

  expect(queryAllByTestId('result-item').length).toBeLessThan(150);
});
