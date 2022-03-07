import { APP_DEFAULTS } from '@config';
import { clamp } from 'ramda';
import { useMemo } from 'react';

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

/**
 * Main logic
 *
 * Based on numFound, page and numPerPage - calculate all the necessary metadata needed to
 * properly display the pagination controls or to calculate the next state
 */
export const calculatePagination = ({ numFound, page, numPerPage }: IUsePaginationProps): IUsePaginationResult => {
  const results = cleanClamp(numFound, 0);
  const totalPages = getTotalPages(results, numPerPage);

  // have to do some special handling for the final page
  let startIndex;
  let endIndex;
  if (page === totalPages) {
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

export interface IUsePaginationProps {
  numFound: number;
  numPerPage: typeof APP_DEFAULTS['PER_PAGE_OPTIONS'][number];
  page: number;
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
}

/**
 * Pagination hook
 *
 * Basically wraps the pagination logic, also uses some memoization to reduce unnecessary renders.
 */
export const usePagination = (props: IUsePaginationProps): IUsePaginationResult => {
  const { numFound = 0, numPerPage = APP_DEFAULTS.RESULT_PER_PAGE, page = 1 } = props;

  const result = useMemo(() => calculatePagination({ numFound, numPerPage, page }), [numFound, numPerPage, page]);

  return result;
};
