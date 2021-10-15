import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid';
import { isBrowser } from '@utils';
import clsx from 'clsx';
import Link from 'next/link';
import React, { HTMLAttributes } from 'react';
import { usePagination } from './usePagination';

export interface IPaginationProps extends HTMLAttributes<HTMLDivElement> {
  totalResults: number;
  numPerPage: number;
  onPageChange: (page: number) => void;
}

const defaultProps = {
  totalResults: 0,
  numPerPage: 10,
};

export const Pagination = (props: IPaginationProps): React.ReactElement => {
  const { totalResults, numPerPage, onPageChange, ...divProps } = props;

  const {
    nextHref,
    prevHref,
    pages,
    startIndex,
    endIndex,
    page,
    noNext,
    noPrev,
    noPagination,
    handleNext,
    handlePrev,
    handlePageChange,
  } = usePagination({
    totalResults,
    numPerPage,
    onPageChange,
  });

  if (noPagination) {
    return null;
  }

  const pageChangeHandler = (idx: number) => {
    return (e: React.MouseEvent<HTMLAnchorElement>) => handlePageChange(e, idx);
  };

  const renderControls = () => {
    return pages.map(({ index, href }) => {
      // current page styling
      if (index === page) {
        return (
          <Link key={href} href={isBrowser() ? '#' : href}>
            <a
              onClick={pageChangeHandler(index)}
              aria-current="page"
              aria-label={`Current page, page ${page}`}
              className="relative z-10 inline-flex items-center px-4 py-2 text-indigo-600 text-sm font-medium bg-indigo-50 border border-indigo-500"
            >
              {index}
            </a>
          </Link>
        );
      }

      // normal, non-current page
      return (
        <Link key={href} href={isBrowser() ? '#' : href}>
          <a
            onClick={pageChangeHandler(index)}
            aria-label={`Goto page ${page}`}
            className="relative inline-flex items-center px-4 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300"
          >
            {index}
          </a>
        </Link>
      );
    });
  };

  const mobilePrevButtonStyles = clsx(
    'relative inline-flex items-center px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-md',
    { 'cursor-not-allowed': noPrev },
  );

  const mobileNextButtonStyles = clsx(
    'relative inline-flex items-center ml-3 px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-md',
    { 'cursor-not-allowed': noNext },
  );

  const prevButtonStyles = clsx(
    'relative inline-flex items-center px-2 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-l-md',
    { 'cursor-not-allowed': noPrev },
  );
  const nextButtonStyles = clsx(
    'relative inline-flex items-center px-2 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-r-md',
    {
      'cursor-not-allowed': noNext,
    },
  );
  const formattedTotalResults = totalResults.toLocaleString();
  const formattedStartIndex = startIndex.toLocaleString();
  const formattedEndIndex = endIndex.toLocaleString();
  const paginationHeading = `Pagination, showing ${formattedStartIndex} to ${
    noNext ? formattedTotalResults : formattedEndIndex
  } of ${formattedTotalResults} results`;

  return (
    <section
      {...divProps}
      aria-labelledby="pagination"
      className="flex items-center justify-between px-4 py-3 bg-white border-gray-200 sm:px-6"
    >
      <h3 className="sr-only" id="pagination">
        {paginationHeading}
      </h3>
      <div className="flex flex-1 justify-between sm:hidden">
        <Link href={isBrowser() ? '#' : prevHref}>
          <a className={mobilePrevButtonStyles} onClick={handlePrev}>
            Previous
          </a>
        </Link>
        <Link href={isBrowser() ? '#' : nextHref}>
          <a className={mobileNextButtonStyles} onClick={handleNext}>
            Next
          </a>
        </Link>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div aria-hidden="true">
          <p className="text-gray-700 text-sm">
            Showing <span className="font-medium">{formattedStartIndex}</span> to{' '}
            <span className="font-medium">{noNext ? formattedTotalResults : formattedEndIndex}</span> of{' '}
            <span className="font-medium">{formattedTotalResults}</span> results
          </p>
        </div>
        <nav
          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
          role="navigation"
          aria-label="Pagination"
        >
          <Link href={isBrowser() ? '#' : prevHref}>
            <a className={prevButtonStyles} onClick={handlePrev}>
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
            </a>
          </Link>

          {renderControls()}

          <Link href={isBrowser() ? '#' : nextHref}>
            <a className={nextButtonStyles} onClick={handleNext}>
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
            </a>
          </Link>
        </nav>
      </div>
    </section>
  );
};
Pagination.defaultProps = defaultProps;
