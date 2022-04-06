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
import { useIsClient } from '@hooks/useIsClient';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { Dispatch, KeyboardEventHandler, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { MenuPlacement } from 'react-select';
import { IUsePaginationResult, PaginationAction } from './usePagination';

export interface IPaginationProps extends IUsePaginationResult {
  totalResults: number;
  hidePerPageSelect?: boolean;
  dispatch: Dispatch<PaginationAction>;
  perPageMenuPlacement?: MenuPlacement;
}

export const Pagination = (props: IPaginationProps): ReactElement => {
  const {
    page = 1,
    totalResults = 0,
    hidePerPageSelect = false,
    endIndex = 1,
    nextPage = 2,
    noNext = true,
    noPagination = true,
    noPrev = true,
    prevPage = 1,
    startIndex = 0,
    totalPages = 1,
    numPerPage = APP_DEFAULTS.RESULT_PER_PAGE,
    dispatch,
    perPageMenuPlacement = 'auto',
  } = props;

  const pageOptions: SelectOption[] = APP_DEFAULTS.PER_PAGE_OPTIONS.map((option) => ({
    id: option.toString(),
    label: option.toString(),
    value: option.toString(),
  }));

  const router = useRouter();
  const isClient = useIsClient();

  // Need only to update the store with the page, it'll be caught upstream
  const handlePrev = () => {
    dispatch({ type: 'PREV_PAGE' });
  };

  const handleNext = () => {
    dispatch({ type: 'NEXT_PAGE' });
  };

  // make sure we keep state and result in sync for pagination
  useEffect(() => dispatch({ type: 'SET_PAGE', payload: page }), [page]);

  const perPageSelectedValue = useMemo(() => pageOptions.find((o) => parseInt(o.value) === numPerPage), [numPerPage]);

  if (noPagination) {
    return null;
  }

  /**
   * Update our internal state perPage, which will trigger on the pagination hook
   */
  const perPageChangeHandler = ({ value }: SelectOption) => {
    const numPerPage = parseInt(value, 10) as typeof APP_DEFAULTS['PER_PAGE_OPTIONS'][number];
    dispatch({ type: 'SET_PERPAGE', payload: numPerPage });
  };

  const formattedTotalResults = totalResults.toLocaleString();
  const formattedStartIndex = (startIndex === 0 ? 1 : startIndex).toLocaleString();
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
        {!hidePerPageSelect && isClient && (
          <Box display={{ base: 'none', xs: 'flex' }}>
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
          {isClient ? (
            <Button
              aria-label="previous"
              onClick={handlePrev}
              data-testid="pagination-prev"
              leftIcon={<ChevronLeftIcon />}
              isDisabled={noPrev}
              variant="pagePrev"
            >
              Prev
            </Button>
          ) : (
            <NextLink href={{ query: { ...router.query, p: prevPage } }} passHref>
              <Link>
                <Button
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
          )}
          {isClient && <ManualPageSelect page={page} totalPages={totalPages} dispatch={dispatch} />}
          {isClient ? (
            <Button
              aria-label="next"
              onClick={handleNext}
              data-testid="pagination-next"
              rightIcon={<ChevronRightIcon />}
              isDisabled={noNext}
              variant="pageNext"
            >
              Next
            </Button>
          ) : (
            <NextLink href={{ query: { ...router.query, p: nextPage } }} passHref>
              <Link>
                <Button
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
          )}
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
  dispatch,
}: {
  page: number;
  totalPages: number;
  dispatch: IPaginationProps['dispatch'];
}) => {
  // hold intermediate page in local state
  const [page, setPage] = useState(currentPage);
  const handleChange = (_: string, page: number) => {
    setPage(Number.isNaN(page) ? 1 : page);
  };

  // submit the change to page
  const handleSubmit = () => {
    if (page !== currentPage) {
      dispatch({ type: 'SET_PAGE', payload: page });
    }
  };

  // on enter, submit the change
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  const pagePickerRef = useRef(null);

  return (
    <Popover placement="top" size="sm" initialFocusRef={pagePickerRef} closeOnBlur>
      <PopoverTrigger>
        <Button aria-label={`current page is ${currentPage}, update page`} variant="pageBetween">
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
