import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid';
import { usePagination } from '@hooks';
import { ISearchMachine } from '@machines/lib/search/types';
import clsx from 'clsx';
import Link from 'next/link';
import React, { HTMLAttributes } from 'react';

export interface IPaginationProps extends HTMLAttributes<HTMLDivElement> {
  service: ISearchMachine;
}
export const Pagination = (props: IPaginationProps): React.ReactElement => {
  const { service: searchService, ...divProps } = props;
  const {
    nextHref,
    prevHref,
    pages,
    page,
    startIndex,
    endIndex,
    totalResults,
    noNext,
    noPrev,
    noPagination,
    handleNext,
    handlePrev,
    handlePageChange,
  } = usePagination(searchService);

  if (noPagination) {
    return null;
  }

  const isBrowser = typeof window !== 'undefined';

  const pageChangeHandler = (idx: number) => {
    return (e: React.MouseEvent<HTMLAnchorElement>) => handlePageChange(e, idx);
  };

  const renderControls = () => {
    return pages.map(({ index, href }) => {
      // current page styling
      if (index === page) {
        return (
          <Link key={href} href={isBrowser ? '#' : href}>
            <a
              onClick={pageChangeHandler(index)}
              aria-current="page"
              className="relative z-10 inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-500 bg-indigo-50"
            >
              {index}
            </a>
          </Link>
        );
      }

      // normal, non-current page
      return (
        <Link key={href} href={isBrowser ? '#' : href}>
          <a
            onClick={pageChangeHandler(index)}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
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

  return (
    <div {...divProps} className="flex items-center justify-between px-4 py-3 bg-white border-gray-200 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        <Link href={isBrowser ? '#' : prevHref}>
          <a className={mobilePrevButtonStyles} onClick={handlePrev}>
            Previous
          </a>
        </Link>
        <Link href={isBrowser ? '#' : nextHref}>
          <a className={mobileNextButtonStyles} onClick={handleNext}>
            Next
          </a>
        </Link>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex}</span> to <span className="font-medium">{endIndex}</span>{' '}
            of <span className="font-medium">{totalResults}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Link href={isBrowser ? '#' : prevHref}>
              <a className={prevButtonStyles} onClick={handlePrev}>
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
              </a>
            </Link>

            {renderControls()}

            <Link href={isBrowser ? '#' : nextHref}>
              <a className={nextButtonStyles} onClick={handleNext}>
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
              </a>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};
