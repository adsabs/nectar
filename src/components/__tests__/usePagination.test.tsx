/* eslint-disable @typescript-eslint/require-await */
/** @jest-environment node  */
import {
  IUsePaginationProps,
  IUsePaginationResult,
  usePagination,
} from '@components/ResultList/Pagination/usePagination';
import { act, renderHook } from '@testing-library/react-hooks';
import { keys, pick } from 'ramda';

const router = {
  pathname: '/',
  push: jest.fn(),
};
jest.mock('next/router', () => ({
  useRouter: () => router,
}));

const setup = (props?: Partial<IUsePaginationProps>) => {
  const initialProps: IUsePaginationProps = {
    numFound: 100,
    ...props,
  };

  return renderHook<IUsePaginationProps, IUsePaginationResult>(
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

  test.concurrent.each(indexTests)('Index Test %p', async ([page, numFound], expected) => {
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
