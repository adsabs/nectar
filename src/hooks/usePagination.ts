import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import { useRouter } from 'next/router';
import qs from 'qs';
import { clamp, range } from 'ramda';
import React, { useCallback } from 'react';

export interface IUsePagination {
  nextHref: string;
  prevHref: string;
  pages: { index: number; href: string }[];
  page: number;
  startIndex: number;
  endIndex: number;
  totalResults: number;
  noPrev: boolean;
  noNext: boolean;
  noPagination: boolean;
  handleNext: React.MouseEventHandler<HTMLAnchorElement>;
  handlePrev: React.MouseEventHandler<HTMLAnchorElement>;
  handlePageChange: (e: React.MouseEvent<HTMLAnchorElement>, page: number) => void;
}

export const usePagination = (searchService: ISearchMachine): IUsePagination => {
  const totalResults = useSelector(searchService, (state) => state.context.result.numFound);
  const numPerPage = useSelector(searchService, (state) => state.context.pagination.numPerPage);

  const updatePagination = (page: number) => {
    searchService.send(TransitionType.SET_PAGINATION, { payload: { pagination: { page } } });
  };

  const { query } = useRouter();
  const { p } = query;
  const page = parseInt(Array.isArray(p) ? p[0] : p) || 1;
  const totalPages = Math.ceil(totalResults / numPerPage) || 1;
  const startIndex = (page - 1) * numPerPage + 1;
  const endIndex = startIndex + numPerPage - 1;

  // spreads the pagination control out, moving the current to the middle after the first few pages
  const pageRange = range(
    page === 1 ? 1 : page === 2 ? page - 1 : page === 3 ? page - 2 : page - 3,
    page < totalPages - 3 ? page + 4 : page + (totalPages - page + 1),
  );

  const handleNext = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      updatePagination(page + 1);
    },
    [page],
  );

  const handlePrev = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      updatePagination(page - 1);
    },
    [page],
  );

  const handlePageChange = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, page: number) => {
      e.preventDefault();
      updatePagination(page);
    },
    [page],
  );

  return {
    nextHref: `/search?${qs.stringify({ ...query, p: clamp(1, totalPages, page + 1) })}`,
    prevHref: `/search?${qs.stringify({ ...query, p: clamp(1, totalPages, page - 1) })}`,
    pages: pageRange.map((index) => ({
      index,
      href: `/search?${qs.stringify({ ...query, p: index })}`,
    })),
    page,
    startIndex,
    endIndex,
    totalResults,
    noPrev: page === 1,
    noNext: page === totalPages,
    noPagination: totalPages === 1,
    handleNext,
    handlePrev,
    handlePageChange,
  };
};
