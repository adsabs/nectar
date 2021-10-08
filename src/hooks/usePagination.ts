import { ISearchMachine, TransitionType } from '@machines/lib/search/types';
import { useSelector } from '@xstate/react';
import { useRouter } from 'next/router';
import qs from 'qs';
import { clamp, range } from 'ramda';
import React, { useCallback, useEffect, useMemo } from 'react';

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
const initialState = {
  nextHref: '',
  prevHref: '',
  pages: [],
  page: 1,
  startIndex: 0,
  endIndex: 1,
  noPrev: true,
  noNext: true,
  noPagination: false,
};

const reducer = (state: typeof initialState, action) => {
  return state;
};

export const usePagination = (searchService: ISearchMachine): IUsePagination => {
  const totalResults = useSelector(searchService, (state) => state.context.result.numFound);
  const numPerPage = useSelector(searchService, (state) => state.context.pagination.numPerPage);

  const updatePagination = (page: number) => {
    searchService.send(TransitionType.SET_PAGINATION, { payload: { pagination: { page } } });
  };

  const [state, setState] = React.useState(initialState);
  const { query } = useRouter();

  useMemo(() => {
    const { p } = query;
    const page = parseInt(Array.isArray(p) ? p[0] : p) || 1;
    const totalPages = Math.ceil(totalResults / numPerPage) || 1;
    // spreads the pagination control out, moving the current to the middle after the first few pages
    const pageRange = range(
      page <= 3 ? 1 : page - 3,
      page < totalPages - 3 ? page + 4 : page + (totalPages - page + 1),
    );
    const startIndex = (page - 1) * numPerPage + 1;
    const endIndex = startIndex + numPerPage - 1;

    setState({
      nextHref: `/search?${qs.stringify({ ...query, p: clamp(1, totalPages, page + 1) })}`,
      prevHref: `/search?${qs.stringify({ ...query, p: clamp(1, totalPages, page - 1) })}`,
      pages: pageRange.map((index) => ({
        index,
        href: `/search?${qs.stringify({ ...query, p: index })}`,
      })),
      page,
      startIndex,
      endIndex,
      noPrev: page === 1,
      noNext: page === totalPages,
      noPagination: totalPages === 1,
    });
  }, [totalResults, numPerPage, query]);

  const handleNext = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      updatePagination(state.page + 1);
    },
    [state.page],
  );

  const handlePrev = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      updatePagination(state.page - 1);
    },
    [state.page],
  );

  const handlePageChange = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, page: number) => {
      e.preventDefault();
      updatePagination(page);
    },
    [state.page],
  );

  return {
    ...state,
    totalResults,
    handleNext,
    handlePrev,
    handlePageChange,
  };
};
