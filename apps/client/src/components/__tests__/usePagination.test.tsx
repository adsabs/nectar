/* eslint-disable @typescript-eslint/require-await */
import {
  calculatePagination,
  cleanClamp,
  defaultPaginationResult,
  getTotalPages,
  IUsePaginationProps,
  IUsePaginationResult,
  usePagination,
} from '@/components/ResultList/Pagination/usePagination';

import { keys, pick } from 'ramda';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const router = {
  pathname: '/',
  push: vi.fn(),
};
vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const setup = (props?: Partial<IUsePaginationProps>) => {
  const initialProps: IUsePaginationProps = {
    numFound: 100,
    ...props,
  };

  return renderHook(
    (props) => {
      const { getPaginationProps } = usePagination(props);
      return getPaginationProps();
    },
    {
      initialProps,
    },
  );
};

// [page, numFound]
const indexTests: [[number, number], Partial<IUsePaginationResult>][] = [
  [[1, 100], { page: 1, noNext: false, noPrev: true, startIndex: 0, endIndex: 10 }],
  [[2, 100], { page: 2, noNext: false, noPrev: false, startIndex: 10, endIndex: 20 }],
  [[Number.MAX_SAFE_INTEGER, 100], { page: 10, noNext: true, noPrev: false, startIndex: 90, endIndex: 100 }],
  [[Number.MIN_SAFE_INTEGER, 100], { page: 1, noNext: false, noPrev: true, startIndex: 0, endIndex: 10 }],
  [[-1, 100], { page: 1, noNext: false, noPrev: true, startIndex: 0, endIndex: 10 }],
  [[10, 100], { page: 10, noNext: true, noPrev: false, startIndex: 90, endIndex: 100 }],
  [[2, 11], { page: 2, noNext: true, noPrev: false, startIndex: 10, endIndex: 11 }],
  [[2, 19], { page: 2, noNext: true, noPrev: false, startIndex: 10, endIndex: 19 }],
];

describe('usePagination Hook', () => {
  beforeEach(() => {
    router.push.mockReset();
  });

  test.concurrent.each(indexTests)('Index Test %p', ([page, numFound], expected) => {
    const { result } = setup({ numFound });
    act(() => result.current.dispatch({ type: 'SET_PAGE', payload: page }));
    expect(pick(keys(expected), result.current)).toEqual(expected);
  });

  test('reset dispatch works properly', () => {
    const { result } = setup();
    act(() => result.current.dispatch({ type: 'SET_PAGE', payload: 5 }));
    const initial = { page: 5, startIndex: 40 };
    const after = { page: 1, startIndex: 0 };
    expect(pick(keys(initial), result.current)).toEqual(initial);
    act(() => result.current.dispatch({ type: 'RESET' }));
    expect(pick(keys(after), result.current)).toEqual(after);
  });

  test('prev page dispatch works properly', () => {
    const { result } = setup();
    act(() => result.current.dispatch({ type: 'SET_PAGE', payload: 5 }));
    const initial = { page: 5, startIndex: 40 };
    const after = { page: 4, startIndex: 30 };
    expect(pick(keys(initial), result.current)).toEqual(initial);
    act(() => result.current.dispatch({ type: 'PREV_PAGE' }));
    expect(pick(keys(after), result.current)).toEqual(after);
  });

  test('next page dispatch works properly', () => {
    const { result } = setup();
    const initial = { page: 1, startIndex: 0 };
    const after = { page: 2, startIndex: 10 };
    expect(pick(keys(initial), result.current)).toEqual(initial);
    act(() => result.current.dispatch({ type: 'NEXT_PAGE' }));
    expect(pick(keys(after), result.current)).toEqual(after);
  });
});

describe('calculatePagination', () => {
  const numPerPage = 10;

  test('should return default result when numFound is 0', () => {
    expect(calculatePagination({ page: 1, numPerPage, numFound: 0 })).toEqual(defaultPaginationResult);
  });

  test('should return correct pagination result when numFound is greater than 0', () => {
    const numFound = 100;
    const totalPages = getTotalPages(numFound, numPerPage);

    expect(calculatePagination({ page: 1, numPerPage, numFound })).toEqual({
      nextPage: 2,
      prevPage: 1,
      noPrev: true,
      noNext: false,
      noPagination: false,
      startIndex: 0,
      endIndex: numPerPage,
      totalPages,
      page: 1,
    });

    expect(calculatePagination({ page: 2, numPerPage, numFound })).toEqual({
      nextPage: 3,
      prevPage: 1,
      noPrev: false,
      noNext: false,
      noPagination: false,
      startIndex: numPerPage,
      endIndex: numPerPage * 2,
      totalPages,
      page: 2,
    });

    expect(calculatePagination({ page: totalPages, numPerPage, numFound })).toEqual({
      nextPage: totalPages,
      prevPage: totalPages - 1,
      noPrev: false,
      noNext: true,
      noPagination: false,
      startIndex: (totalPages - 1) * numPerPage,
      endIndex: numFound,
      totalPages,
      page: totalPages,
    });
  });

  test('should return correct pagination result when numFound is less than or equal to the default number of results per page', () => {
    const numFound = 10;
    const totalPages = getTotalPages(numFound, numPerPage);

    expect(calculatePagination({ page: 1, numPerPage, numFound })).toEqual({
      nextPage: 1,
      prevPage: 1,
      noPrev: true,
      noNext: true,
      noPagination: true,
      startIndex: 0,
      endIndex: numFound,
      totalPages,
      page: 1,
    });
  });
});

describe('cleanClamp', () => {
  test('should return the minimum value if the input is less than the minimum', () => {
    expect(cleanClamp(-1, 0, 10)).toEqual(0);
    expect(cleanClamp(-100, 0, 10)).toEqual(0);
  });

  test('should return the maximum value if the input is greater than the maximum', () => {
    expect(cleanClamp(11, 0, 10)).toEqual(10);
    expect(cleanClamp(100, 0, 10)).toEqual(10);
  });

  test('should return the input value if it is between the minimum and maximum', () => {
    expect(cleanClamp(5, 0, 10)).toEqual(5);
    expect(cleanClamp(0, 0, 10)).toEqual(0);
    expect(cleanClamp(10, 0, 10)).toEqual(10);
  });

  test('should return the absolute value of the parsed number if the input is a string', () => {
    expect(cleanClamp('-5', 0, 10)).toEqual(5);
    expect(cleanClamp('5', 0, 10)).toEqual(5);
    expect(cleanClamp('0', 0, 10)).toEqual(0);
    expect(cleanClamp('10', 0, 10)).toEqual(10);
  });

  test('should return the minimum value if input is not number or string', () => {
    expect(cleanClamp({}, 0, 10)).toEqual(0);
    expect(cleanClamp([], 0, 10)).toEqual(0);
    expect(cleanClamp(null, 0, 10)).toEqual(0);
    expect(cleanClamp(undefined, 0, 10)).toEqual(0);
  });
});
