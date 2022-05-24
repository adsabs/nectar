import { Button } from '@chakra-ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Box, Flex, Link, Stack, Text } from '@chakra-ui/layout';
import {
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  VisuallyHidden,
} from '@chakra-ui/react';
import { Select, SelectOption } from '@components';
import { APP_DEFAULTS } from '@config';
import { NumPerPageType, SafeSearchUrlParams } from '@types';
import { makeSearchParams, stringifySearchParams } from '@utils';
import NextLink, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import { curryN } from 'ramda';
import { KeyboardEventHandler, ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { MenuPlacement } from 'react-select';
import { calculatePagination } from './usePagination';

type NumPerPageProp =
  | {
      numPerPage: NumPerPageType;
      hidePerPageSelect?: false;
      perPageMenuPlacement?: MenuPlacement;
      onPerPageSelect?: (numPerPage: NumPerPageType) => void;
    }
  | {
      numPerPage?: NumPerPageType;
      hidePerPageSelect?: true;
      perPageMenuPlacement?: MenuPlacement;
      onPerPageSelect?: (numPerPage: NumPerPageType) => void;
    };
export type PaginationProps = {
  linksExtendQuery?: boolean;
  onNext?: (nextPage: number) => void;
  onPageSelect?: (page: number) => void;
  onPrevious?: (prevPage: number) => void;
  page: number;
  skipRouting?: boolean;
  totalResults: number;
} & NumPerPageProp;

export const Pagination = (props: PaginationProps): ReactElement => {
  const {
    hidePerPageSelect = false,
    linksExtendQuery = false,
    numPerPage = APP_DEFAULTS.RESULT_PER_PAGE,
    onNext,
    onPageSelect,
    onPerPageSelect,
    onPrevious,
    page = 1,
    perPageMenuPlacement = 'auto',
    skipRouting = false,
    totalResults = 0,
  } = props;

  const router = useRouter();
  const pageOptions: SelectOption[] = APP_DEFAULTS.PER_PAGE_OPTIONS.map((option) => ({
    id: option.toString(),
    label: option.toString(),
    value: option.toString(),
  }));

  const { endIndex, startIndex, nextPage, noNext, noPagination, noPrev, prevPage, totalPages } = calculatePagination({
    numPerPage,
    page,
    numFound: totalResults,
  });

  const perPageSelectedValue = useMemo(() => pageOptions.find((o) => parseInt(o.value) === numPerPage), [numPerPage]);

  /**
   * Update our internal state perPage, which will trigger on the pagination hook
   */
  const perPageChangeHandler = useCallback(
    ({ value }: SelectOption) => {
      const numPerPage = parseInt(value, 10) as typeof APP_DEFAULTS['PER_PAGE_OPTIONS'][number];
      if (typeof onPerPageSelect === 'function') {
        onPerPageSelect(numPerPage);
      }
    },
    [onPerPageSelect],
  );

  const handleClick = useCallback(
    curryN(2, (type: 'prev' | 'next', e: MouseEvent) => {
      if (skipRouting) {
        e.preventDefault();
      }

      if (typeof onPrevious === 'function' && type === 'prev') {
        onPrevious(prevPage);
      }

      if (typeof onNext === 'function' && type === 'next') {
        onNext(nextPage);
      }
    }),
    [onPrevious, onNext],
  );

  const getLinkParams = useCallback(
    (page: number): LinkProps => {
      const search = linksExtendQuery
        ? makeSearchParams({ ...router.query, p: page } as SafeSearchUrlParams)
        : stringifySearchParams({ p: page });

      return {
        href: { pathname: router.pathname, search },
        as: { pathname: router.asPath.split('?')[0], search },
      };
    },
    [router.pathname, router.asPath, router.query],
  );

  if (noPagination) {
    return null;
  }
  const formattedTotalResults = totalResults.toLocaleString();
  const formattedStartIndex = (startIndex + 1).toLocaleString();
  const formattedEndIndex = endIndex.toLocaleString();
  const paginationHeading = `Pagination, showing ${formattedStartIndex} to ${
    noNext ? formattedTotalResults : formattedEndIndex
  } of ${formattedTotalResults} results`;

  return (
    <Box as="section" data-testid="pagination-container" aria-labelledby="pagination" mt={3}>
      <VisuallyHidden as="h3" id="pagination">
        {paginationHeading}
      </VisuallyHidden>
      <Flex justifyContent={{ base: 'end', xs: 'space-between' }}>
        <Box data-testid="pagination-label" display={{ base: 'none', sm: 'flex' }}>
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
        {!hidePerPageSelect && (
          <Box display={{ base: 'none', xs: 'flex' }} data-testid="pagination-numperpage">
            <Select
              label="Select number of results to show per page"
              options={pageOptions}
              onChange={perPageChangeHandler}
              value={perPageSelectedValue}
              stylesTheme="default.sm"
              menuPlacement={perPageMenuPlacement}
            />
          </Box>
        )}
        <Stack direction="row" spacing={0} role="navigation" aria-label="Pagination">
          <NextLink {...getLinkParams(prevPage)} passHref shallow>
            <Link>
              <Button
                onClick={handleClick('prev')}
                aria-label="previous"
                data-testid="pagination-prev"
                leftIcon={<ChevronLeftIcon />}
                isDisabled={noPrev}
                variant="pagePrev"
              >
                Prev
              </Button>
            </Link>
          </NextLink>
          <ManualPageSelect page={page} totalPages={totalPages} skipRouting={skipRouting} onPageSelect={onPageSelect} />

          <NextLink {...getLinkParams(nextPage)} passHref shallow>
            <Link>
              <Button
                onClick={handleClick('next')}
                aria-label="next"
                data-testid="pagination-next"
                rightIcon={<ChevronRightIcon />}
                isDisabled={noNext}
                variant="pageNext"
              >
                Next
              </Button>
            </Link>
          </NextLink>
        </Stack>
      </Flex>
    </Box>
  );
};

/**
 * Popover for manually selecting a page
 */
const ManualPageSelect = ({
  page: currentPage = 1,
  totalPages = 1,
  skipRouting,
  onPageSelect,
}: {
  page: number;
  totalPages: number;
  onPageSelect: (page: number) => void;
  skipRouting: boolean;
}) => {
  const router = useRouter();
  // hold intermediate page in local state
  const [page, setPage] = useState(currentPage);
  const handleChange = (_: string, page: number) => {
    setPage(Number.isNaN(page) ? 1 : page);
  };

  // submit the change to page
  const handleSubmit = () => {
    if (page !== currentPage) {
      if (!skipRouting) {
        void router.push({
          pathname: router.pathname,
          search: makeSearchParams({ ...router.query, p: page } as SafeSearchUrlParams),
        });
      }
      if (typeof onPageSelect === 'function') {
        onPageSelect(page);
      }
    }
  };

  // on enter, submit the change
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };
  const pagePickerRef = useRef(null);

  return (
    <Popover placement="top" size="sm" initialFocusRef={pagePickerRef} closeOnBlur>
      <PopoverTrigger>
        <Button
          aria-label={`current page is ${currentPage}, update page`}
          variant="pageBetween"
          data-testid="pagination-select-page"
        >
          {currentPage.toLocaleString()} of {totalPages.toLocaleString()}
        </Button>
      </PopoverTrigger>
      <PopoverContent maxW={150}>
        <PopoverHeader fontWeight="semibold">Select Page</PopoverHeader>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <Stack spacing={2}>
            <NumberInput
              defaultValue={currentPage}
              min={1}
              max={totalPages}
              value={page}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            >
              <NumberInputField ref={pagePickerRef} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Button onClick={handleSubmit}>Goto Page {page}</Button>
          </Stack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
