import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
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
  Stack,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

import { APP_DEFAULTS } from '@/config';
import { NumPerPageType, SafeSearchUrlParams } from '@/types';
import { useRouter } from 'next/router';
import { clamp, curryN } from 'ramda';
import { Dispatch, FC, KeyboardEventHandler, ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { MenuPlacement } from 'react-select';
import { calculatePagination, PaginationAction, PaginationResult } from './usePagination';
import { Select, SelectOption } from '@/components/Select';
import { ISimpleLinkProps, SimpleLink } from '@/components/SimpleLink';
import { makeSearchParams, stringifySearchParams } from '@/utils/common/search';

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
  /** only render buttons for the controls */
  noLinks?: boolean;
  onNext?: (nextPage: number) => void;
  onPageSelect?: (page: number) => void;
  onPrevious?: (prevPage: number) => void;
  page: number;
  skipRouting?: boolean;
  totalResults: number;
  dispatch?: Dispatch<PaginationAction>;
  alwaysShow?: boolean;
  canNext?: (ctx: PaginationResult) => boolean;
  canPrev?: (ctx: PaginationResult) => boolean;
  isLoading?: boolean;
  /** only updates page param, removes other params */
  onlyUpdatePageParam?: boolean;
} & NumPerPageProp;

export const Pagination = (props: PaginationProps): ReactElement => {
  const {
    hidePerPageSelect = false,
    noLinks = false,
    numPerPage = APP_DEFAULTS.RESULT_PER_PAGE,
    onNext,
    onPageSelect,
    onPerPageSelect,
    onPrevious,
    page: pageProp = 1,
    perPageMenuPlacement = 'auto',
    skipRouting = false,
    totalResults = 0,
    dispatch,
    alwaysShow,
    canNext,
    canPrev,
    isLoading = false,
    onlyUpdatePageParam = false,
  } = props;

  const pageOptions: SelectOption[] = APP_DEFAULTS.PER_PAGE_OPTIONS.map((option) => ({
    id: option.toString(),
    label: option.toString(),
    value: option.toString(),
  }));

  const pagination = calculatePagination({
    numPerPage,
    page: pageProp,
    numFound: totalResults,
  });

  const { page, endIndex, startIndex, nextPage, noPagination, prevPage, totalPages } = pagination;

  // allow override of the normal next/prev checks
  const noNext = typeof canNext === 'function' ? !canNext(pagination) : pagination.noNext;
  const noPrev = typeof canPrev === 'function' ? !canPrev(pagination) : pagination.noPrev;

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
      if (typeof dispatch === 'function') {
        dispatch({ type: 'SET_PERPAGE', payload: numPerPage });
      }
    },
    [onPerPageSelect],
  );

  const handleClick = useCallback(
    curryN(2, (type: 'prev' | 'next', e: MouseEvent) => {
      if (skipRouting) {
        e.preventDefault();
      }

      if (typeof dispatch === 'function' && type === 'prev') {
        dispatch({ type: 'PREV_PAGE' });
      }

      if (typeof dispatch === 'function' && type === 'next') {
        dispatch({ type: 'NEXT_PAGE' });
      }

      if (typeof onPrevious === 'function' && type === 'prev') {
        onPrevious(prevPage);
      }

      if (typeof onNext === 'function' && type === 'next') {
        onNext(nextPage);
      }
    }),
    [onPrevious, onNext, dispatch],
  );

  if (noPagination && !alwaysShow) {
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
      <Flex justifyContent={{ base: 'end', xs: 'space-between' }} alignItems="center">
        <Box data-testid="pagination-label" display={{ base: 'none', sm: 'flex' }}>
          {totalResults === 0 ? null : (
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
          )}
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
              id="pagination-select"
            />
          </Box>
        )}
        <Stack direction="row" spacing={0} role="navigation" aria-label="Pagination">
          {isLoading ? null : (
            <>
              <PaginationButton page={prevPage} noLinks={noLinks} onlyUpdatePageParam={onlyUpdatePageParam}>
                <Button
                  onClick={handleClick('prev')}
                  aria-label="previous"
                  data-testid="pagination-prev"
                  leftIcon={<ChevronLeftIcon />}
                  isDisabled={noPrev}
                  variant="pagePrev"
                  isLoading={isLoading}
                >
                  Prev
                </Button>
              </PaginationButton>
              <ManualPageSelect
                page={page}
                totalPages={totalPages}
                skipRouting={skipRouting}
                dispatch={dispatch}
                onPageSelect={onPageSelect}
              />
            </>
          )}
          {/* force only a button to render if we're loading */}
          {isLoading ? (
            <Button type="button" isLoading={isLoading} variant="pageLoading" />
          ) : (
            <PaginationButton page={nextPage} noLinks={noLinks} onlyUpdatePageParam={onlyUpdatePageParam}>
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
            </PaginationButton>
          )}
        </Stack>
      </Flex>
    </Box>
  );
};

const PaginationButton: FC<{ page: number; noLinks: boolean; onlyUpdatePageParam: boolean }> = (props) => {
  const { children, page, noLinks, onlyUpdatePageParam } = props;
  const router = useRouter();
  const getLinkParams = useCallback(
    (page: number): ISimpleLinkProps => {
      const search = onlyUpdatePageParam
        ? stringifySearchParams({ ...router.query, p: page })
        : makeSearchParams({
            ...router.query,
            p: page,
          } as SafeSearchUrlParams);

      return {
        href: { pathname: router.pathname, search },
      };
    },
    [router.pathname, router.asPath, router.query],
  );

  return noLinks ? (
    <>{children}</>
  ) : (
    <SimpleLink {...getLinkParams(page)} shallow>
      {children}
    </SimpleLink>
  );
};

const cleanPage = (page: number) => (Number.isNaN(page) ? 1 : page);
const clampPage = (page: number, totalPages: number) => clamp(1, totalPages, page);
/**
 * Popover for manually selecting a page
 */
const ManualPageSelect = ({
  page: currentPage = 1,
  totalPages = 1,
  skipRouting,
  dispatch,
  onPageSelect,
}: {
  page: number;
  totalPages: number;
  onPageSelect: (page: number) => void;
  dispatch: Dispatch<PaginationAction>;
  skipRouting: boolean;
}) => {
  const router = useRouter();
  // hold intermediate page in local state
  const [page, setPage] = useState(currentPage);
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  const handleChange = useCallback(
    (_: string, page: number) => {
      setPage(clampPage(cleanPage(page), totalPages));
    },
    [totalPages],
  );

  // submit the change to page
  const handleSubmit = useCallback(() => {
    if (page !== currentPage) {
      if (!skipRouting) {
        void router.push({
          pathname: router.pathname,
          search: makeSearchParams({ ...router.query, p: page } as SafeSearchUrlParams),
        });
      }
      if (typeof dispatch === 'function') {
        dispatch({ type: 'SET_PAGE', payload: page });
      }

      if (typeof onPageSelect === 'function') {
        onPageSelect(page);
      }
    }
    close();
  }, [page, currentPage, skipRouting, dispatch, onPageSelect]);

  // on enter, submit the change
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };
  const pagePickerRef = useRef(null);

  return (
    <Popover
      placement="top"
      size="sm"
      isOpen={isOpen}
      onClose={close}
      onOpen={open}
      initialFocusRef={pagePickerRef}
      closeOnBlur
      returnFocusOnClose
    >
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
          <FormControl>
            <FormLabel hidden>Select Page</FormLabel>
            <Stack spacing={2}>
              <NumberInput
                defaultValue={currentPage}
                min={1}
                max={totalPages}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
              >
                <NumberInputField ref={pagePickerRef} />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Button onClick={handleSubmit}>Goto Page {page.toLocaleString()}</Button>
            </Stack>
          </FormControl>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
