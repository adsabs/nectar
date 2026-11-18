import { afterEach, beforeEach, expect, test } from 'vitest';
import { saveScrollPosition, takeSavedRowIndex } from './useScrollRestoration';

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
  window.history.pushState({}, '', '/search?q=star');
  Object.defineProperty(window, 'scrollY', { value: 12345, configurable: true });
  sessionStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('a windowed list saves the top visible row index instead of a pixel offset', () => {
  mountWindowedRows(5, 180);

  saveScrollPosition();

  expect(JSON.parse(sessionStorage.getItem(SCROLL_ROW_INDEX_KEY))).toEqual({ index: 180, search: 'q=star' });
  expect(sessionStorage.getItem(SCROLL_POSITION_KEY)).toBeNull();
});

test('a row index saved on the search page is not consumed off it', () => {
  mountWindowedRows(3, 42);
  saveScrollPosition();

  window.history.pushState({}, '', '/abs/2020arXiv/references');

  expect(takeSavedRowIndex()).toBeNull();
  expect(sessionStorage.getItem(SCROLL_ROW_INDEX_KEY)).not.toBeNull();
});

test('a row index saved under a different query is not applied to it', () => {
  mountWindowedRows(3, 42);
  saveScrollPosition();

  window.history.pushState({}, '', '/search?q=quasar');

  expect(takeSavedRowIndex()).toBeNull();
});

test('a detour through another search does not destroy the saved index', () => {
  mountWindowedRows(3, 42);
  saveScrollPosition();

  window.history.pushState({}, '', '/search?q=quasar');
  expect(takeSavedRowIndex()).toBeNull();

  window.history.pushState({}, '', '/search?q=star');
  expect(takeSavedRowIndex()).toBe(42);
});

test('a garbage entry is dropped rather than retried forever', () => {
  sessionStorage.setItem(SCROLL_ROW_INDEX_KEY, 'not json');

  expect(takeSavedRowIndex()).toBeNull();
  expect(sessionStorage.getItem(SCROLL_ROW_INDEX_KEY)).toBeNull();
});

test('volatile url params do not break the match', () => {
  mountWindowedRows(3, 42);
  saveScrollPosition();

  window.history.pushState({}, '', '/search?q=star&d=general');

  expect(takeSavedRowIndex()).toBe(42);
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
