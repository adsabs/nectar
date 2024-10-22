import { APP_DEFAULTS } from '@/config';
import { NumPerPageType } from '@/types';
import memoizeOne from 'memoize-one';
import { clamp, equals } from 'ramda';
import { Dispatch, Reducer, useCallback, useEffect, useReducer } from 'react';
import { isNumPerPageType } from '@/utils/common/guards';
import { logger } from '@/logger';

/**
 * Calculate the total pages based on the number of results and how many records per page
 */
export const getTotalPages = (totalResults: number, numPerPage: number): number => {
  try {
    const pages = Math.ceil(totalResults / numPerPage);
    return pages <= 0 ? 1 : pages;
  } catch (err) {
    logger.error({ err, totalResults, numPerPage }, 'Error caught attempting to calculate total pages');
    return 1;
  }
};

/**
 * Will convert the value from string to number and clamp the value between min and max
 */
export const cleanClamp = (value: unknown, min = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  try {
    if (typeof value === 'number' && value >= min) {
      return clamp(min, max, value);
    } else if (typeof value === 'string') {
      return clamp(min, max, Math.abs(parseInt(value, 10)));
    }
    return min;
  } catch (err) {
    logger.error({ err, value, min, max }, 'Error caught attempting to clamp value');
    return min;
  }
};

export const defaultPaginationResult: PaginationResult = {
  page: 1,
  endIndex: 1,
  nextPage: 2,
  noNext: false,
  noPagination: true,
  noPrev: true,
  prevPage: 1,
  startIndex: 0,
  totalPages: 1,
};

/**
 * Utility for calculating the page given a start and numPerPage
 * This makes no assumptions about number of total records, so page could
 * be out of range.
 */
export const calculatePage = (startIndex: number, numPerPage: number) => {
  return cleanClamp(Math.floor(startIndex / numPerPage) + 1, 1, Number.MAX_SAFE_INTEGER);
};

export const calculateStartIndex = (page: number, numPerPage: number, numFound: number = Number.MAX_SAFE_INTEGER) => {
  const results = cleanClamp(numFound, 0);
  if (page <= 1) {
    // on first page, always start at 0
    return 0;
  }

  // on last page
  if (page * numPerPage >= results) {
    if (results % numPerPage === 0) {
      return results - numPerPage;
    } else {
      return results - (results % numPerPage);
    }
  }

  // otherwise do our normal calculation
  return cleanClamp((page - 1) * numPerPage, 1, results - numPerPage + 1);
};

/**
 * Main logic
 *
 * Based on numFound, page and numPerPage - calculate all the necessary metadata needed to
 * properly display the pagination controls or to calculate the next state
 */
export const calculatePagination = memoizeOne(
  ({
    numFound = Number.MAX_SAFE_INTEGER,
    page,
    numPerPage,
  }: {
    numFound?: number;
    page: number;
    numPerPage: NumPerPageType | number;
  }): PaginationResult => {
    const results = cleanClamp(numFound, 0);

    if (results === 0) {
      // if no results return a default state
      return defaultPaginationResult;
    }

    const totalPages = getTotalPages(results, numPerPage);

    let startIndex;
    let endIndex;
    // have to do some special handling for the final page
    if (page <= 1) {
      startIndex = 0;
      endIndex = numPerPage;
    } else if (page >= totalPages) {
      // for the final page, we can calculate directly from results
      if (results % numPerPage === 0) {
        startIndex = results - numPerPage;
      } else {
        startIndex = results - (results % numPerPage);
      }
      endIndex = results;
    } else {
      startIndex = cleanClamp((page - 1) * numPerPage, 1, results - numPerPage + 1);
      endIndex = startIndex + numPerPage;
    }

    // calculate new page based on startIndex and numPerPage
    const newPage = cleanClamp(Math.floor(startIndex / numPerPage) + 1, 1, totalPages);

    return {
      // utility
      nextPage: cleanClamp(newPage + 1, 1, totalPages),
      prevPage: cleanClamp(newPage - 1, 1, totalPages),
      noPrev: newPage === 1,
      noNext: newPage === totalPages,
      noPagination: numFound <= APP_DEFAULTS.RESULT_PER_PAGE,

      // meta
      startIndex,
      endIndex,
      totalPages,
      page: newPage,
    };
  },
  equals,
);

export interface IUsePaginationProps {
  numFound: number;
  numPerPage?: NumPerPageType;
  page?: number;
  onStateChange?: (pagination: PaginationResult, state: IPaginationState, dispatch: Dispatch<PaginationAction>) => void;
}

export interface IUsePaginationResult {
  nextPage: number;
  prevPage: number;
  startIndex: number;
  endIndex: number;
  page: number;
  totalPages: number;
  noPagination: boolean;
  noNext: boolean;
  noPrev: boolean;
  numPerPage: NumPerPageType;
  dispatch: Dispatch<PaginationAction>;
}

export type PaginationResult = Omit<IUsePaginationResult, 'dispatch' | 'numPerPage'>;

export interface IPaginationState {
  page: number;
  numPerPage: NumPerPageType;
  numFound: number;
}

export type PaginationAction =
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' }
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_NUMFOUND'; payload: number }
  | { type: 'SET_PERPAGE'; payload: NumPerPageType };

const reducer: Reducer<IPaginationState, PaginationAction> = (state, action) => {
  switch (action.type) {
    case 'NEXT_PAGE':
      return { ...state, page: state.page + 1 };
    case 'PREV_PAGE':
      return { ...state, page: state.page - 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'RESET':
      return { ...state, page: 1 };
    case 'SET_PERPAGE':
      // on perPage change, we should reset back to page 1
      return { ...state, numPerPage: action.payload, page: 1 };
    case 'SET_NUMFOUND':
      return { ...state, numFound: action.payload };
    default:
      return state;
  }
};

const initialState: IPaginationState = {
  page: 1,
  numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
  numFound: Number.MAX_SAFE_INTEGER,
};
/**
 * Pagination hook
 *
 * Basically wraps the pagination logic, also uses some memoization to reduce unnecessary renders.
 */
export const usePagination = (props: IUsePaginationProps) => {
  const { numFound = 0, page = 1, numPerPage = APP_DEFAULTS.RESULT_PER_PAGE, onStateChange } = props;
  const [state, dispatch] = useReducer(reducer, { ...initialState, page });

  useEffect(
    () =>
      dispatch({
        type: 'SET_PERPAGE',
        payload: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE,
      }),
    [numPerPage],
  );

  // watch page changes, this allows consumers to force changes via props
  useEffect(() => dispatch({ type: 'SET_PAGE', payload: cleanClamp(page, 1) }), [page]);

  // watch changes to numFound
  useEffect(() => dispatch({ type: 'SET_NUMFOUND', payload: cleanClamp(numFound, 0) }), [numFound]);

  // trigger onStateChange handler when state changes
  useEffect(() => {
    if (typeof onStateChange === 'function' && state.numFound > 0) {
      const pagination = calculatePagination({ ...state });
      onStateChange(pagination, state, dispatch);
    }
  }, [onStateChange, state]);

  const getPaginationProps = useCallback(() => {
    return {
      ...calculatePagination({ ...state }),
      numPerPage: state.numPerPage,
      dispatch,
    };
  }, [state]);

  return { getPaginationProps, calculatePage, calculatePagination, calculateStartIndex };
};
