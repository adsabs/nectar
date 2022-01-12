import { Box, Flex, Text, Link } from '@chakra-ui/layout';
import { Button, IconButton } from '@chakra-ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import NextLink from 'next/link';
import { HTMLAttributes, MouseEvent, ReactElement, useState, useEffect } from 'react';
import { usePagination } from './usePagination';
import { VisuallyHidden } from '@chakra-ui/react';

export interface IPaginationProps extends HTMLAttributes<HTMLDivElement> {
  totalResults: number;
  numPerPage: number;
  onPageChange: (page: number) => void;
}

const defaultProps = {
  totalResults: 0,
  numPerPage: 10,
};

export const Pagination = (props: IPaginationProps): ReactElement => {
  const { totalResults, numPerPage, onPageChange, ...divProps } = props;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      // current page styling
      if (index === page) {
        return isMounted ? (
          <Button
            key={href}
            onClick={pageChangeHandler(index)}
            aria-current="page"
            data-testid="pagination-item"
            aria-label={`Current page, page ${page}`}
            variant="pageCurrent"
          >
            {index}
          </Button>
        ) : (
          <NextLink key={href} href={href} passHref>
            <Link aria-current="page" data-testid="pagination-item" aria-label={`Current page, page ${page}`}>
              {index}
            </Link>
          </NextLink>
        );
      }

      // normal, non-current page
      return isMounted ? (
        <Button
          key={href}
          onClick={pageChangeHandler(index)}
          aria-label={`Goto page ${page}`}
          data-testid="pagination-item"
          variant="page"
        >
          {index}
        </Button>
      ) : (
        <NextLink key={href} href={href} passHref>
          <Link aria-label={`Goto page ${page}`} data-testid="pagination-item">
            {index}
          </Link>
        </NextLink>
      );
    });
  };

  const formattedTotalResults = totalResults.toLocaleString();
  const formattedStartIndex = startIndex.toLocaleString();
  const formattedEndIndex = endIndex.toLocaleString();
  const paginationHeading = `Pagination, showing ${formattedStartIndex} to ${
    noNext ? formattedTotalResults : formattedEndIndex
  } of ${formattedTotalResults} results`;

  return (
    <Box as="section" {...divProps} data-testid="pagination-container" aria-labelledby="pagination" mt={3}>
      <VisuallyHidden as="h3" id="pagination">
        {paginationHeading}
      </VisuallyHidden>
      <Box display={{ sm: 'none' }}>
        {isMounted ? (
          <Flex justifyContent="space-between">
            <Button onClick={handlePrev} data-testid="pagination-prev" variant="outline" isDisabled={noPrev}>
              Previous
            </Button>
            <Button onClick={handleNext} data-testid="pagination-next" variant="outline" isDisabled={noNext}>
              Next
            </Button>
          </Flex>
        ) : (
          <Flex justifyContent="space-between">
            {noPrev ? (
              <Text variant="disabledLink">Previous</Text>
            ) : (
              <NextLink href={prevHref} passHref>
                <Link data-testid="pagination-prev">Previous</Link>
              </NextLink>
            )}
            {noNext ? (
              <Text variant="disabledLink">Next</Text>
            ) : (
              <NextLink href={nextHref} passHref>
                <Link data-testid="pagination-next">Next</Link>
              </NextLink>
            )}
          </Flex>
        )}
      </Box>
      <Flex justifyContent="space-between" display={{ base: 'none', sm: 'flex' }}>
        <Box data-testid="pagination-label">
          <Text>
            Showing{' '}
            <Text as="span" fontWeight="semibold">
              {formattedStartIndex}
            </Text>{' '}
            to{' '}
            <Text as="span" fontWeight="semibold">
              {noNext ? formattedTotalResults : formattedEndIndex}
            </Text>{' '}
            of{' '}
            <Text as="span" fontWeight="semibold">
              {formattedTotalResults}
            </Text>{' '}
            results
          </Text>
        </Box>
        <Box
          className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
          role="navigation"
          aria-label="Pagination"
        >
          {isMounted ? (
            <IconButton
              aria-label="previous"
              onClick={handlePrev}
              data-testid="pagination-prev"
              icon={<ChevronLeftIcon />}
              isDisabled={noPrev}
              variant="pagePrev"
            />
          ) : (
            <NextLink href={prevHref} passHref>
              <Link>
                <IconButton
                  aria-label="previous"
                  data-testid="pagination-prev"
                  icon={<ChevronLeftIcon />}
                  isDisabled={noPrev}
                  variant="pagePrev"
                />
              </Link>
            </NextLink>
          )}

          {isMounted && renderControls()}

          {isMounted ? (
            <IconButton
              aria-label="next"
              onClick={handleNext}
              data-testid="pagination-next"
              icon={<ChevronRightIcon />}
              isDisabled={noNext}
              variant="pageNext"
            />
          ) : (
            <NextLink href={nextHref} passHref>
              <Link>
                <IconButton
                  aria-label="next"
                  data-testid="pagination-next"
                  icon={<ChevronRightIcon />}
                  isDisabled={noNext}
                  variant="pageNext"
                />
              </Link>
            </NextLink>
          )}
        </Box>
      </Flex>
    </Box>
  );
};
Pagination.defaultProps = defaultProps;
