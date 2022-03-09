import { APP_DEFAULTS } from '@config';
import { useRouter } from 'next/router';
import { clamp } from 'ramda';
import { Dispatch, Reducer, useEffect, useMemo, useReducer } from 'react';

/**
 * Calculate the total pages based on the number of results and how many records per page
 */
const getTotalPages = (totalResults: number, numPerPage: number): number => {
  try {
    const pages = Math.ceil(totalResults / numPerPage);
    return pages <= 0 ? 1 : pages;
  } catch (e) {
    return 1;
  }
};

/**
 * Will convert the value from string to number and clamp the value between min and max
 */
const cleanClamp = (value: unknown, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  try {
    if (typeof value === 'number' && value >= min) {
      return clamp(min, max, value);
    } else if (typeof value === 'string') {
      return clamp(min, max, Math.abs(parseInt(value, 10)));
    }
    return min;
  } catch (e) {
    return min;
  }
};

const defaultResult: Omit<IUsePaginationResult, 'dispatch' | 'numPerPage'> = {
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
 * Main logic
 *
 * Based on numFound, page and numPerPage - calculate all the necessary metadata needed to
 * properly display the pagination controls or to calculate the next state
 */
export const calculatePagination = ({
  numFound,
  page,
  numPerPage,
}: {
  numFound: number;
  page: number;
  numPerPage: NumPerPageType;
}): Omit<IUsePaginationResult, 'dispatch' | 'numPerPage'> => {
  const results = cleanClamp(numFound, 0);

  if (results === 0) {
    // if no results return a default state
    return defaultResult;
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
      startIndex = results - numPerPage + 1;
    } else {
      startIndex = results - (results % numPerPage) + 1;
    }
    endIndex = results;
  } else {
    startIndex = cleanClamp((page - 1) * numPerPage + 1, 1, results - numPerPage + 1);
    endIndex = startIndex + numPerPage - 1;
  }

  // calculate new page based on startIndex and numPerPage
  const newPage = cleanClamp(Math.floor(startIndex / numPerPage) + 1, 1, totalPages);

  return {
    // utility
    nextPage: cleanClamp(newPage + 1, 1, totalPages),
    prevPage: cleanClamp(newPage - 1, 1, totalPages),
    noPrev: newPage === 1,
    noNext: newPage === totalPages,
    noPagination: totalPages <= 1,

    // meta
    startIndex,
    endIndex,
    totalPages,
    page: newPage,
  };
};

type NumPerPageType = typeof APP_DEFAULTS['PER_PAGE_OPTIONS'][number];

export interface IUsePaginationProps {
  numFound: number;
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

export interface IPaginationState {
  page: number;
  numPerPage: NumPerPageType;
}

export type PaginationAction =
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' }
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; payload: number }
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
    default:
      return state;
  }
};

const initialState: IPaginationState = {
  page: 1,
  numPerPage: APP_DEFAULTS.RESULT_PER_PAGE,
};
/**
 * Pagination hook
 *
 * Basically wraps the pagination logic, also uses some memoization to reduce unnecessary renders.
 */
export const usePagination = (props: IUsePaginationProps): IUsePaginationResult => {
  const { numFound = 0 } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();

  const result = useMemo(
    () => calculatePagination({ numFound, numPerPage: state.numPerPage, page: state.page }),
    [numFound, state],
  );

  // push new params as page changes (ONLY page change)
  useEffect(() => {
    router.push({ pathname: router.pathname, query: { ...router.query, p: result.page } }, null, { shallow: true });
  }, [result.page]);

  return { ...result, numPerPage: state.numPerPage, dispatch };
};
