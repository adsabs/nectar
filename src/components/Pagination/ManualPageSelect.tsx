import {
  Popover,
  PopoverTrigger,
  Button,
  PopoverContent,
  PopoverHeader,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Stack,
} from '@chakra-ui/react';
import { clamp } from 'ramda';
import { useState, useCallback, KeyboardEventHandler, useRef, useEffect } from 'react';

const cleanPage = (page: number) => (Number.isNaN(page) ? 1 : page);
const clampPage = (page: number, totalPages: number) => clamp(1, totalPages, page);

export const ManualPageSelect = ({
  page: currentPage = 1,
  totalPages = 1,
  onPageSelect,
  isDisabled,
}: {
  page: number;
  totalPages: number;
  onPageSelect: (page: number) => void;
  isDisabled: boolean;
}) => {
  // hold intermediate page in local state
  const [page, setPage] = useState(currentPage);
  const [isOpen, setIsOpen] = useState(false);
  const open = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  useEffect(() => {
    setPage(currentPage);
  }, [currentPage]);

  const handleChange = useCallback(
    (_: string, page: number) => {
      setPage(clampPage(cleanPage(page), totalPages));
    },
    [totalPages],
  );

  // submit the change to page
  const handleSubmit = useCallback(() => {
    if (page !== currentPage) {
      onPageSelect(page);
    }
    close();
  }, [page, currentPage, onPageSelect]);

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
          isDisabled={isDisabled}
        >
          {currentPage.toLocaleString()} of {totalPages > 0 ? totalPages.toLocaleString() : 1}
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
              <NumberInput value={page} min={1} max={totalPages} onChange={handleChange} onKeyDown={handleKeyDown}>
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
