import { describe, expect, test } from 'vitest';

import { calculatePage, calculateStartIndex, cleanClamp, getTotalPages } from './pagination';

describe('getTotalPages', () => {
  test('rounds a partial page up', () => {
    expect(getTotalPages(15, 10)).toBe(2);
  });

  test('reports a single page for an exact fit', () => {
    expect(getTotalPages(10, 10)).toBe(1);
  });

  test('never reports fewer than one page', () => {
    expect(getTotalPages(0, 10)).toBe(1);
  });
});

describe('cleanClamp', () => {
  test('keeps an in-range number', () => {
    expect(cleanClamp(5, 0, 10)).toBe(5);
  });

  test('clamps above the maximum', () => {
    expect(cleanClamp(50, 0, 10)).toBe(10);
  });

  test('floors a number below the minimum', () => {
    expect(cleanClamp(-5, 0, 10)).toBe(0);
  });

  test('parses a numeric string', () => {
    expect(cleanClamp('7', 0, 10)).toBe(7);
  });

  test('falls back to the minimum for a non-numeric type', () => {
    expect(cleanClamp(undefined, 3, 10)).toBe(3);
  });

  // A NaN here would propagate into the solr `start` param and into the query
  // hash, so it has to resolve to a number.
  test('does not return NaN for an unparseable string', () => {
    expect(cleanClamp('not-a-number', 0, 10)).not.toBeNaN();
  });
});

describe('calculatePage', () => {
  test('maps a start index back to its page', () => {
    expect(calculatePage(20, 10)).toBe(3);
  });

  test('treats a zero start as page one', () => {
    expect(calculatePage(0, 10)).toBe(1);
  });

  test('never returns a page below one', () => {
    expect(calculatePage(-40, 10)).toBe(1);
  });
});

describe('calculateStartIndex', () => {
  test('starts at zero on the first page', () => {
    expect(calculateStartIndex(1, 10, 100)).toBe(0);
  });

  test('offsets by a full page for an interior page', () => {
    expect(calculateStartIndex(3, 10, 100)).toBe(20);
  });

  test('offsets without a result count, as the server must', () => {
    expect(calculateStartIndex(3, 10)).toBe(20);
  });

  test('clamps to the last full page when the total divides evenly', () => {
    expect(calculateStartIndex(2, 10, 20)).toBe(10);
  });

  test('clamps to the start of a partial last page', () => {
    expect(calculateStartIndex(2, 10, 15)).toBe(10);
  });

  test('pulls a page past the end back to the last page', () => {
    expect(calculateStartIndex(9, 10, 15)).toBe(10);
  });

  test('falls back to zero when the result set is smaller than one page', () => {
    expect(calculateStartIndex(2, 10, 5)).toBe(0);
  });

  // A negative start is rejected upstream, and this is reachable: a deep link
  // to page 2 of a query that matches nothing.
  test('never returns a negative start for an empty result set', () => {
    expect(calculateStartIndex(2, 10, 0)).toBeGreaterThanOrEqual(0);
  });

  test('never returns a negative start for a nonsensical result count', () => {
    expect(calculateStartIndex(5, 10, -1)).toBeGreaterThanOrEqual(0);
  });

  test('never returns a negative start across a sweep of empty-ish inputs', () => {
    for (const page of [2, 3, 10]) {
      for (const numFound of [0, 1, 2]) {
        expect(calculateStartIndex(page, 10, numFound)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
