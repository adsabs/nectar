/* eslint-disable @typescript-eslint/require-await */
import {
  IPaginationState,
  IUsePaginationProps,
  IUsePaginationResult,
  usePagination,
} from '@components/ResultList/Pagination/usePagination';
import { act, renderHook } from '@testing-library/react-hooks';
import { pick } from 'ramda';

const router = {
  push: jest.fn(),
};
jest.mock('next/router', () => ({
  useRouter: () => router,
}));

const setup = (props?: Partial<IUsePaginationProps>) => {
  const onNumPerPageChange = jest.fn();
  const onPageChange = jest.fn();

  const initialProps: IUsePaginationProps = {
    numFound: 100,
    ...props,
  };

  const util = renderHook<IUsePaginationProps, IUsePaginationResult>((props) => usePagination(props), {
    initialProps,
  });

  return { ...util, initialProps, onNumPerPageChange, onPageChange };
};

const gen = (
  num: number,
  defaultProps?: Partial<IUsePaginationResult>,
): [[number, IPaginationState['numPerPage']], Partial<IUsePaginationResult>][] =>
  [10, 25, 50, 100].map((perPage) => [
    [num, perPage as IPaginationState['numPerPage']],
    { totalPages: 1, noPagination: true, ...defaultProps },
  ]);

// [page, numPerPage]
const basicTests: [[number, IPaginationState['numPerPage']], Partial<IUsePaginationResult>][] = [
  ...gen(0),
  ...gen(1),
  ...gen(-1),
  ...gen(9),
  ...gen(-90000),
  ...gen(1.2343434),
  ...gen(-394834),

  // 19
  [[19, 10], { totalPages: 2, noPagination: false }],
  [[19, 25], { totalPages: 1, noPagination: true }],
  [[19, 50], { totalPages: 1, noPagination: true }],
  [[19, 100], { totalPages: 1, noPagination: true }],

  // 21
  [[21, 10], { totalPages: 3, noPagination: false }],
  [[21, 25], { totalPages: 1, noPagination: true }],
  [[21, 50], { totalPages: 1, noPagination: true }],
  [[21, 100], { totalPages: 1, noPagination: true }],

  // 4321
  [[4321, 10], { totalPages: 433, noPagination: false }],
  [[4321, 25], { totalPages: 173, noPagination: false }],
  [[4321, 50], { totalPages: 87, noPagination: false }],
  [[4321, 100], { totalPages: 44, noPagination: false }],

  // 3000
  [[3000, 10], { totalPages: 300, noPagination: false }],
  [[3000, 25], { totalPages: 120, noPagination: false }],
  [[3000, 50], { totalPages: 60, noPagination: false }],
  [[3000, 100], { totalPages: 30, noPagination: false }],

  // 2000.333
  [[2000.333, 10], { totalPages: 201, noPagination: false }],
  [[2000.333, 25], { totalPages: 81, noPagination: false }],
  [[2000.333, 50], { totalPages: 41, noPagination: false }],
  [[2000.333, 100], { totalPages: 21, noPagination: false }],

  // 384455
  [[384455, 10], { totalPages: 38446, noPagination: false }],
  [[384455, 25], { totalPages: 15379, noPagination: false }],
  [[384455, 50], { totalPages: 7690, noPagination: false }],
  [[384455, 100], { totalPages: 3845, noPagination: false }],
];

test.concurrent.each(basicTests)(`Page Test %p`, async ([numFound, numPerPage], expected) => {
  const { result } = setup({ numFound });
  act(() => result.current.dispatch({ type: 'SET_PERPAGE', payload: numPerPage }));
  expect(pick(Object.keys(expected), result.current)).toEqual(expected);
});

// [page, numFound]
const indexTests: [[number, number], Partial<IUsePaginationResult>][] = [
  [[1, 100], { page: 1, noNext: false, noPrev: true, startIndex: 0, endIndex: 10 }],
  [[2, 100], { page: 2, noNext: false, noPrev: false, startIndex: 11, endIndex: 20 }],
  [[Number.MAX_SAFE_INTEGER, 100], { page: 10, noNext: true, noPrev: false, startIndex: 91, endIndex: 100 }],
  [[Number.MIN_SAFE_INTEGER, 100], { page: 1, noNext: false, noPrev: true, startIndex: 0, endIndex: 10 }],
  [[-1, 100], { page: 1, noNext: false, noPrev: true, startIndex: 0, endIndex: 10 }],
  [[10, 100], { page: 10, noNext: true, noPrev: false, startIndex: 91, endIndex: 100 }],
  [[2, 11], { page: 2, noNext: true, noPrev: false, startIndex: 11, endIndex: 11 }],
  [[2, 19], { page: 2, noNext: true, noPrev: false, startIndex: 11, endIndex: 19 }],
];

test.concurrent.each(indexTests)('Index Test %p', async ([page, numFound], expected) => {
  const { result } = setup({ numFound });
  act(() => result.current.dispatch({ type: 'SET_PAGE', payload: page }));
  expect(pick(Object.keys(expected), result.current)).toEqual(expected);
});
