import { APP_DEFAULTS } from '@config';
import { noop, useBaseRouterPath } from '@utils';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { clamp, range } from 'ramda';
import { MouseEvent, MouseEventHandler, useCallback, useEffect, useMemo } from 'react';
import { UrlObject } from 'url';
export interface IUsePagination {
  nextHref: UrlObject;
  prevHref: UrlObject;
  pages: { index: number; href: UrlObject }[];
  startIndex: number;
  endIndex: number;
  page: number;
  noPrev: boolean;
  noNext: boolean;
  noPagination: boolean;
  totalPages: number;
  handleNext: MouseEventHandler<HTMLButtonElement>;
  handlePrev: MouseEventHandler<HTMLButtonElement>;
  handlePageChange: (e: MouseEvent<HTMLButtonElement>, page: number) => void;
}

export interface IUsePaginationProps {
  totalResults: number;
  numPerPage: number;
  onPageChange?: (page: number, start: number) => void;
}

/**
 *
 */
const parsePageFromQuery = (query: ParsedUrlQuery): number => {
  try {
    const { p } = query;
    const page = parseInt(Array.isArray(p) ? p[0] : p, 10);
    return page === 0 || Number.isNaN(page) ? 1 : page;
  } catch (e) {
    return 1;
  }
};

/**
 *
 */
const getTotalPages = (totalResults: number, numPerPage: number): number => {
  try {
    const pages = Math.ceil(totalResults / clamp(1, 500, numPerPage));
    return pages === 0 ? 1 : pages;
  } catch (e) {
    return 1;
  }
};

export const usePagination = ({
  totalResults = 1,
  numPerPage = APP_DEFAULTS.RESULT_PER_PAGE,
  onPageChange = noop,
}: IUsePaginationProps): IUsePagination => {
  const { query } = useRouter();
  const { basePath } = useBaseRouterPath();

  const state = useMemo(() => {
    let page = parsePageFromQuery(query);
    const totalPages = getTotalPages(totalResults, numPerPage);

    // make sure page cannot surpass totalPages
    if (page > totalPages) {
      page = totalPages;
    }

    // spreads the pagination control out, moving the current to the middle after the first few pages
    const pageRange = range(
      page <= 3 ? 1 : page - 3,
      page < totalPages - 3 ? page + 4 : page + (totalPages - page + 1),
    );
    const startIndex = (page - 1) * numPerPage + 1;
    const endIndex = startIndex + numPerPage - 1;

    return {
      nextHref: { pathname: basePath, query: { ...query, p: clamp(1, totalPages, page + 1) } },
      prevHref: { pathname: basePath, query: { ...query, p: clamp(1, totalPages, page - 1) } },
      pages: pageRange.map((index) => ({
        index,
        href: { pathname: basePath, query: { ...query, p: index } },
      })),
      page,
      startIndex,
      endIndex,
      noPrev: page === 1,
      noNext: page === totalPages,
      totalPages,
      noPagination: totalPages === 1,
    };
  }, [totalResults, numPerPage, query, basePath]);

  const handleNext = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (state.noNext) {
        return;
      }

      const page = state.page + 1;
      const start = (state.page - 1) * numPerPage;
      onPageChange(page, start);
    },
    [state.page, onPageChange],
  );

  const handlePrev = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (state.noPrev) {
        return;
      }

      const page = state.page - 1;
      const start = (state.page - 1) * numPerPage;
      onPageChange(page, start);
    },
    [state.page, onPageChange],
  );

  const handlePageChange = useCallback(
    (e: MouseEvent<HTMLButtonElement>, page: number) => {
      e.preventDefault();

      if (page === state.page) {
        return;
      }

      const start = (page - 1) * numPerPage;
      onPageChange(page, start);
    },
    [state.page, onPageChange],
  );

  useEffect(() => {
    const start = (state.page - 1) * numPerPage;
    onPageChange(state.page, start);
  }, [state.page]);

  return {
    ...state,
    handleNext,
    handlePrev,
    handlePageChange,
  };
};
