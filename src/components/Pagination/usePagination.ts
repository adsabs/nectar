import { parsePageFromQuery, useBaseRouterPath } from '@utils';
import { useRouter } from 'next/router';
import qs from 'qs';
import { range } from 'ramda';
import { useMemo } from 'react';

export interface IUsePagination {
  nextHref: string;
  prevHref: string;
  pages: { index: number; href: string }[];
  startIndex: number;
  endIndex: number;
  page: number;
  noPrev: boolean;
  noNext: boolean;
  noPagination: boolean;
  totalPages: number;
}

export interface IUsePaginationProps {
  totalResults: number;
  numPerPage: number;
}

/**
 * calculate the total number of pages based on the results and number per page
 */
const getTotalPages = (totalResults: number, numPerPage: number): number => {
  try {
    const pages = Math.abs(Math.ceil(totalResults / numPerPage));
    return pages === 0 ? 1 : pages;
  } catch (e) {
    return 1;
  }
};

/**
 * clamp current page to be within our result set
 */
const clampPage = (totalPages: number, page: number) => {
  if (page > totalPages) {
    return totalPages;
  } else if (page < 1) {
    return 1;
  }
  return page;
};

export const usePagination = ({ totalResults = 1, numPerPage = 10 }: IUsePaginationProps): IUsePagination => {
  const basePath = useBaseRouterPath();
  const { query } = useRouter();

  const pagination = useMemo(() => {
    const perPage = [10].includes(numPerPage) ? numPerPage : 10;
    const parsedPage = parsePageFromQuery(query);
    const totalPages = getTotalPages(totalResults, perPage);
    const page = clampPage(totalPages, parsedPage);

    // spreads the pagination control out, moving the current to the middle after the first few pages
    const pageRange = range(
      page <= 3 ? 1 : page - 3,
      page < totalPages - 3 ? page + 4 : page + (totalPages - page + 1),
    );
    const startIndex = (page - 1) * perPage + 1;
    const endIndex = startIndex + perPage - 1;

    return {
      nextHref: `${basePath}?${qs.stringify({ ...query, p: clampPage(totalPages, page + 1) })}`,
      prevHref: `${basePath}?${qs.stringify({ ...query, p: clampPage(totalPages, page - 1) })}`,
      pages: pageRange.map((index) => ({
        index,
        href: `${basePath}?${qs.stringify({ ...query, p: index })}`,
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

  return pagination;
};
