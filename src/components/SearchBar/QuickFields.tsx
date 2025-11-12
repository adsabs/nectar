import { Button, Flex, FlexProps, HStack, Text } from '@chakra-ui/react';
import { Dispatch, MouseEvent, ReactElement, useCallback } from 'react';

import { quickfields } from './models';
import { AllSearchTermsDropdown } from '@/components/SearchBar/AllSearchTermsDropdown';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useStore } from '@/store';
import { AppMode } from '@/types';
import { isNil } from 'ramda';
import { useIsClient } from '@/lib/useIsClient';

export interface IQuickFieldsProps extends FlexProps {
  isLoading?: boolean;
  dispatch: Dispatch<SearchInputAction>;
}

export const QuickFields = (props: IQuickFieldsProps): ReactElement => {
  const { isLoading, dispatch, ...elProps } = props;

  const mode: AppMode = useStore((state) => state.mode);
  const isClient = useIsClient();

  const handleQFSelect = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!isLoading) {
        dispatch({
          type: 'SET_SEARCH_TERM_ADDITION',
          payload: {
            queryAddition: e.currentTarget.dataset['value'],
            cursorPos: isNil(e.currentTarget.dataset['cursor'])
              ? undefined
              : Number.parseInt(e.currentTarget.dataset['cursor']),
          },
        });
      }
    },
    [dispatch, isLoading],
  );

  const handleASTSelect = useCallback(
    (queryAddition: string, cursorPos?: number) => {
      if (!isLoading) {
        dispatch({ type: 'SET_SEARCH_TERM_ADDITION', payload: { queryAddition, cursorPos } });
      }
    },
    [dispatch, isLoading],
  );

  return (
    <Flex direction="row" justifyContent="start" fontSize="md" gap={5} {...elProps}>
      <HStack spacing={5} fontSize="md" display={{ base: 'none', sm: 'inherit' }} id="quick-fields">
        <Text>QUICK FIELD: </Text>
        {!isClient
          ? null
          : (quickfields[mode] ?? quickfields.default).map((term) => (
              <Button
                key={term.id}
                onClick={handleQFSelect}
                variant="link"
                tabIndex={0}
                data-value={term.value}
                data-cursor={term.cursorPos}
                size="md"
                data-testid="quickfield"
              >
                {term.title}
              </Button>
            ))}
      </HStack>
      <AllSearchTermsDropdown onSelect={handleASTSelect} />
    </Flex>
  );
};
