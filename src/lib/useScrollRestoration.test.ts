import { afterEach, beforeEach, expect, test } from 'vitest';
import { clearScrollPosition, saveScrollPosition, takeSavedRowIndex } from './useScrollRestoration';

const SCROLL_POSITION_KEY = 'search-scroll-position';
const SCROLL_ROW_INDEX_KEY = 'search-scroll-row-index';
const ROW_HEIGHT = 150;

const mountWindowedRows = (count: number, firstVisibleIndex: number) => {
  const results = document.createElement('div');
  results.id = 'results';
  for (let i = 0; i < count; i += 1) {
    const row = document.createElement('div');
    row.setAttribute('data-index', String(firstVisibleIndex + i));
    Object.defineProperty(row, 'offsetHeight', { value: ROW_HEIGHT, configurable: true });
    row.getBoundingClientRect = () => ({ top: i * ROW_HEIGHT - 20, height: ROW_HEIGHT } as DOMRect);
    results.appendChild(row);
  }
  document.body.appendChild(results);
};

beforeEach(() => {
  window.history.pushState({}, '', '/search');
  Object.defineProperty(window, 'scrollY', { value: 12345, configurable: true });
  sessionStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('a windowed list saves the top visible row index instead of a pixel offset', () => {
  mountWindowedRows(5, 180);

  saveScrollPosition();

  expect(sessionStorage.getItem(SCROLL_ROW_INDEX_KEY)).toBe('180');
  expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBeNull();
});

test('an ordinary list saves the pixel offset and no row index', () => {
  document.body.innerHTML = '<div id="results"><div>no windowed rows here</div></div>';

  saveScrollPosition();

  expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBe('12345');
  expect(sessionStorage.getItem(SCROLL_ROW_INDEX_KEY)).toBeNull();
});

test('taking the row index consumes it, so a remount does not scroll again', () => {
  mountWindowedRows(3, 42);
  saveScrollPosition();

  expect(takeSavedRowIndex()).toBe(42);
  expect(takeSavedRowIndex()).toBeNull();
});

test('saving off the search page is ignored', () => {
  window.history.pushState({}, '', '/abs/2020arXiv/abstract');
  mountWindowedRows(3, 42);

  saveScrollPosition();

  expect(sessionStorage.getItem(SCROLL_ROW_INDEX_KEY)).toBeNull();
  expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBeNull();
});

test('clearing drops both the pixel offset and the row index', () => {
  sessionStorage.setItem(SCROLL_POSITION_KEY, '900');
  sessionStorage.setItem(SCROLL_ROW_INDEX_KEY, '12');

  clearScrollPosition();

  expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBeNull();
  expect(sessionStorage.getItem(SCROLL_ROW_INDEX_KEY)).toBeNull();
});
