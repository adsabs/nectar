import { describe, expect, test } from 'vitest';
import type { Serie } from '@nivo/line';
import type { YearDatum } from '../types';
import { getLineGraphXTicks, getQueryWithCondition, getYearGraphTicks, groupBarDatumByYear } from './utils';

const makeYearDatum = (year: number, refereed: number, notrefereed: number): YearDatum => ({
  year,
  refereed,
  notrefereed,
});

describe('getLineGraphXTicks', () => {
  test('returns evenly spaced ticks across the full x range from mixed series', () => {
    const data: Serie[] = [
      {
        id: 'first',
        data: [
          { x: 2001, y: 1 },
          { x: 2003, y: 2 },
        ],
      },
      {
        id: 'second',
        data: [
          { x: '2002', y: 3 },
          { x: '2006', y: 4 },
        ],
      },
    ];

    expect(getLineGraphXTicks(data, 3)).toEqual([2001, 2003, 2005]);
  });

  test('returns a single tick when all x values are the same', () => {
    const data: Serie[] = [
      {
        id: 'only',
        data: [
          { x: 1999, y: 1 },
          { x: '1999', y: 2 },
        ],
      },
    ];

    expect(getLineGraphXTicks(data, 4)).toEqual([1999]);
  });

  test('returns an empty array for empty input', () => {
    expect(getLineGraphXTicks([], 5)).toEqual([]);
  });
});

describe('groupBarDatumByYear', () => {
  test('groups year data into summed ranges based on max x ticks', () => {
    const yearData: YearDatum[] = [
      makeYearDatum(2000, 1, 10),
      makeYearDatum(2001, 2, 20),
      makeYearDatum(2002, 3, 30),
      makeYearDatum(2003, 4, 40),
      makeYearDatum(2004, 5, 50),
    ];

    expect(groupBarDatumByYear(yearData, 2, 0, yearData.length)).toEqual([
      { year: '2000 - 2002', refereed: 6, notrefereed: 60 },
      { year: '2003 - 2004', refereed: 9, notrefereed: 90 },
    ]);
  });

  test('returns a single-year label when grouping a single item', () => {
    const yearData: YearDatum[] = [makeYearDatum(2010, 7, 11)];

    expect(groupBarDatumByYear(yearData, 3, 0, 1)).toEqual([{ year: '2010 - 2010', refereed: 7, notrefereed: 11 }]);
  });

  test('returns an empty array when the requested range is empty', () => {
    const yearData: YearDatum[] = [makeYearDatum(2010, 7, 11)];

    expect(groupBarDatumByYear(yearData, 3, 0, 0)).toEqual([]);
  });
});

describe('getQueryWithCondition', () => {
  test('wraps an unparenthesized query before appending the condition', () => {
    expect(getQueryWithCondition('author:einstein', 'year', '[2000 TO 2005]')).toBe(
      '(author:einstein) AND year:[2000 TO 2005]',
    );
  });

  test('preserves an already parenthesized query', () => {
    expect(getQueryWithCondition('(author:einstein OR author:curie)', 'read_count', '[10 TO *]')).toBe(
      '(author:einstein OR author:curie) AND read_count:[10 TO *]',
    );
  });

  test('handles an empty query string using the current implementation behavior', () => {
    expect(getQueryWithCondition('', 'citation_count', '[1 TO 5]')).toBe('() AND citation_count:[1 TO 5]');
  });
});

describe('getYearGraphTicks', () => {
  test('returns every nth year based on the provided maxTicks step', () => {
    const data: YearDatum[] = [
      makeYearDatum(2000, 1, 1),
      makeYearDatum(2001, 1, 1),
      makeYearDatum(2002, 1, 1),
      makeYearDatum(2003, 1, 1),
      makeYearDatum(2004, 1, 1),
    ];

    expect(getYearGraphTicks(data, 2)).toEqual([2000, 2002, 2004]);
  });

  test('returns the only year for a single-item input', () => {
    expect(getYearGraphTicks([makeYearDatum(1995, 1, 1)], 3)).toEqual([1995]);
  });

  test('returns an empty array for empty input', () => {
    expect(getYearGraphTicks([], 2)).toEqual([]);
  });
});
