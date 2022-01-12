import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid';
import { isBrowser } from '@utils';
import clsx from 'clsx';
import Link from 'next/link';
import { HTMLAttributes, MouseEvent, ReactElement } from 'react';
import { usePagination } from './usePagination';

export interface IPaginationProps extends HTMLAttributes<HTMLDivElement> {
  totalResults: number;
  numPerPage: number;
  onPageChange: (page: number, start: number) => void;
}

const defaultProps = {
  totalResults: 0,
  numPerPage: 10,
};

export const Pagination = (props: IPaginationProps): ReactElement => {
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
    return (e: MouseEvent<HTMLButtonElement>) => handlePageChange(e, idx);
  };

  const renderControls = () => {
    return pages.map(({ index, href }) => {
      const key = `pagination-link${href.pathname}/${index}`;

      // current page styling
      if (index === page) {
        return isBrowser() ? (
          <button
            type="button"
            key={key}
            onClick={pageChangeHandler(index)}
            aria-current="page"
            data-testid="pagination-item"
            aria-label={`Current page, page ${page}`}
            className="relative z-10 inline-flex items-center px-4 py-2 text-indigo-600 text-sm font-medium bg-indigo-50 border border-indigo-500"
          >
            {index.toLocaleString()}
          </button>
        ) : (
          <Link key={key} href={href}>
            <a
              aria-current="page"
              data-testid="pagination-item"
              aria-label={`Current page, page ${page}`}
              className="relative z-10 inline-flex items-center px-4 py-2 text-indigo-600 text-sm font-medium bg-indigo-50 border border-indigo-500"
            >
              {index.toLocaleString()}
            </a>
          </Link>
        );
      }

      // normal, non-current page
      return isBrowser() ? (
        <button
          type="button"
          key={key}
          onClick={pageChangeHandler(index)}
          aria-label={`Goto page ${page}`}
          data-testid="pagination-item"
          className="relative inline-flex items-center px-4 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300"
        >
          {index.toLocaleString()}
        </button>
      ) : (
        <Link key={key} href={href}>
          <a
            aria-label={`Goto page ${page}`}
            data-testid="pagination-item"
            className="relative inline-flex items-center px-4 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300"
          >
            {index.toLocaleString()}
          </a>
        </Link>
      );
    });
  };

  const mobilePrevButtonStyles = clsx(
    'relative inline-flex items-center px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-md',
    { 'cursor-not-allowed opacity-70': noPrev },
  );

  const mobileNextButtonStyles = clsx(
    'relative inline-flex items-center ml-3 px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-md',
    { 'cursor-not-allowed opacity-70': noNext },
  );

  const prevButtonStyles = clsx(
    'relative inline-flex items-center px-2 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-l-md',
    { 'cursor-not-allowed opacity-70': noPrev },
  );
  const nextButtonStyles = clsx(
    'relative inline-flex items-center px-2 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-r-md',
    {
      'cursor-not-allowed opacity-70': noNext,
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
      data-testid="pagination-container"
      aria-labelledby="pagination"
      className="flex items-center justify-between px-4 py-3 bg-white border-gray-200 sm:px-6"
    >
      <h3 className="sr-only" id="pagination">
        {paginationHeading}
      </h3>
      <div className="flex flex-1 justify-between sm:hidden">
        {isBrowser() ? (
          <>
            <button type="button" className={mobilePrevButtonStyles} onClick={handlePrev} data-testid="pagination-prev">
              Previous
            </button>
            <button type="button" className={mobileNextButtonStyles} onClick={handleNext} data-testid="pagination-next">
              Next
            </button>
          </>
        ) : (
          <>
            <Link href={prevHref}>
              <a className={mobilePrevButtonStyles} data-testid="pagination-prev">
                Previous
              </a>
            </Link>

            <Link href={nextHref}>
              <a className={mobileNextButtonStyles} data-testid="pagination-next">
                Next
              </a>
            </Link>
          </>
        )}
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div data-testid="pagination-label">
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
          {isBrowser() ? (
            <button type="button" className={prevButtonStyles} onClick={handlePrev} data-testid="pagination-prev">
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <Link href={prevHref}>
              <a className={prevButtonStyles} data-testid="pagination-prev">
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
              </a>
            </Link>
          )}

          {renderControls()}

          {isBrowser() ? (
            <button type="button" className={nextButtonStyles} onClick={handleNext} data-testid="pagination-next">
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <Link href={nextHref}>
              <a className={nextButtonStyles} data-testid="pagination-next">
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
              </a>
            </Link>
          )}
        </nav>
      </div>
    </section>
  );
};
Pagination.defaultProps = defaultProps;
