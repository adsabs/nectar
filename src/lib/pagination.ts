import memoizeOne from 'memoize-one';
import { clamp, equals } from 'ramda';

import { APP_DEFAULTS } from '@/config';
import { logger } from '@/logger';
import { NumPerPageType } from '@/types';

export interface PaginationResult {
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

export const getTotalPages = (totalResults: number, numPerPage: number): number => {
  try {
    const pages = Math.ceil(totalResults / numPerPage);
    return pages <= 0 ? 1 : pages;
  } catch (err) {
    logger.error({ err, totalResults, numPerPage }, 'Error caught attempting to calculate total pages');
    return 1;
  }
};

export const cleanClamp = (value: unknown, min = 0, max: number = Number.MAX_SAFE_INTEGER): number => {
  try {
    if (typeof value === 'number' && value >= min) {
      return clamp(min, max, value);
    } else if (typeof value === 'string') {
      const parsed = Math.abs(parseInt(value, 10));
      return Number.isNaN(parsed) ? min : clamp(min, max, parsed);
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

// Makes no assumption about total records, so the page can be out of range.
export const calculatePage = (startIndex: number, numPerPage: number) => {
  return cleanClamp(Math.floor(startIndex / numPerPage) + 1, 1, Number.MAX_SAFE_INTEGER);
};

export const calculateStartIndex = (page: number, numPerPage: number, numFound: number = Number.MAX_SAFE_INTEGER) => {
  const results = cleanClamp(numFound, 0);
  if (page <= 1) {
    return 0;
  }

  if (page * numPerPage >= results) {
    if (results % numPerPage === 0) {
      return Math.max(0, results - numPerPage);
    } else {
      return Math.max(0, results - (results % numPerPage));
    }
  }

  return cleanClamp((page - 1) * numPerPage, 1, results - numPerPage + 1);
};

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
      return defaultPaginationResult;
    }

    const totalPages = getTotalPages(results, numPerPage);

    let startIndex;
    let endIndex;
    if (page <= 1) {
      startIndex = 0;
      endIndex = numPerPage;
    } else if (page >= totalPages) {
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

    const newPage = cleanClamp(Math.floor(startIndex / numPerPage) + 1, 1, totalPages);

    return {
      nextPage: cleanClamp(newPage + 1, 1, totalPages),
      prevPage: cleanClamp(newPage - 1, 1, totalPages),
      noPrev: newPage === 1,
      noNext: newPage === totalPages,
      noPagination: numFound <= APP_DEFAULTS.RESULT_PER_PAGE,

      startIndex,
      endIndex,
      totalPages,
      page: newPage,
    };
  },
  equals,
);
