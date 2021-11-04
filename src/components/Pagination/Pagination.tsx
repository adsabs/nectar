import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid';
import clsx from 'clsx';
import Link from 'next/link';
import { HTMLAttributes, memo, MouseEvent, ReactElement } from 'react';
import { usePagination } from './usePagination';

export interface IPaginationProps extends HTMLAttributes<HTMLElement> {
  totalResults: number;
  numPerPage: number;
  onPageChange?(page: number): void;
}

export const Pagination = memo((props: IPaginationProps): ReactElement => {
  const { totalResults = 10, numPerPage = 10, onPageChange, ...elProps } = props;
  const { nextHref, prevHref, pages, startIndex, endIndex, page, noNext, noPrev, noPagination } = usePagination({
    totalResults,
    numPerPage,
  });

  const getClickHandler = (newPage: number) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof onPageChange === 'function') {
      e.preventDefault();
      onPageChange(newPage);
    }
  };

  // no results, don't show controls
  if (noPagination) {
    return null;
  }

  const renderControls = () => {
    return pages.map(({ index, href }) => {
      // current page styling
      if (index === page) {
        return (
          <li
            key={href}
            aria-current="page"
            aria-label={`Current page, page ${page}`}
            className="relative z-10 inline-flex items-center px-4 py-2 text-indigo-600 text-sm font-medium bg-indigo-50 border border-indigo-500"
          >
            {page}
          </li>
        );
      }

      // normal, non-current page
      return (
        <li key={href}>
          <Link href={href} prefetch={false}>
            <a
              aria-label={`Goto page ${index}`}
              data-testid="pagination-item"
              className="relative inline-flex items-center px-4 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300"
              onClick={getClickHandler(index)}
            >
              {index}
            </a>
          </Link>
        </li>
      );
    });
  };

  // styling
  const containerCls = 'flex items-center justify-between px-4 py-3 bg-white sm:px-6';
  const mobileNextPrevBtn =
    'relative inline-flex items-center px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-md';
  const prevButtonStyles = clsx(
    'relative inline-flex items-center px-2 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-l-md',
    { 'cursor-not-allowed opacity-60 border-opacity-60': noPrev },
  );
  const nextButtonStyles = clsx(
    'relative inline-flex items-center px-2 py-2 text-gray-500 text-sm font-medium hover:bg-gray-50 bg-white border border-gray-300 rounded-r-md',
    {
      'cursor-not-allowed opacity-60 border-opacity-60': noNext,
    },
  );

  // strings
  const formattedTotalResults = totalResults.toLocaleString();
  const formattedStartIndex = startIndex.toLocaleString();
  const formattedEndIndex = endIndex.toLocaleString();
  const paginationHeading = `Pagination, showing ${formattedStartIndex} to ${
    noNext ? formattedTotalResults : formattedEndIndex
  } of ${formattedTotalResults} results`;

  return (
    <section aria-labelledby="pagination" className={containerCls} data-testid="pagination-container" {...elProps}>
      <h3 className="sr-only" id="pagination">
        {paginationHeading}
      </h3>

      {/* Mobile pagination buttons */}
      <div className="flex flex-1 justify-between sm:hidden">
        <Link href={prevHref} prefetch={false}>
          <a
            className={clsx(mobileNextPrevBtn, { 'cursor-not-allowed opacity-60 border-opacity-60': noPrev })}
            onClick={getClickHandler(page - 1)}
          >
            Previous
          </a>
        </Link>
        <Link href={nextHref} prefetch={false}>
          <a
            className={clsx(mobileNextPrevBtn, 'ml-3', { 'cursor-not-allowed opacity-60 border-opacity-60': noNext })}
            onClick={getClickHandler(page + 1)}
          >
            Next
          </a>
        </Link>
      </div>

      {/* Regular pagination buttons */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div data-testid="pagination-label">
          <p className="text-gray-700 text-sm">
            Showing <span className="font-medium">{formattedStartIndex}</span> to{' '}
            <span className="font-medium">{noNext ? formattedTotalResults : formattedEndIndex}</span> of{' '}
            <span className="font-medium">{formattedTotalResults}</span> results
          </p>
        </div>

        <nav role="navigation" aria-label="Pagination Navigation">
          <ul className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <li key={prevHref}>
              <Link href={prevHref} prefetch={false}>
                <a className={prevButtonStyles} data-testid="pagination-prev" onClick={getClickHandler(page - 1)}>
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
                </a>
              </Link>
            </li>
            {renderControls()}
            <li key={nextHref}>
              <Link href={nextHref} prefetch={false}>
                <a className={nextButtonStyles} data-testid="pagination-next" onClick={getClickHandler(page + 1)}>
                  <span className="sr-only">Previous</span>
                  <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
                </a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* hidden field to hold value for form */}
      <input type="hidden" name="p" value={page} />
    </section>
  );
});
