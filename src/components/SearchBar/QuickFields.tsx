import { Button, Flex, FlexProps, HStack, ResponsiveValue, Text } from '@chakra-ui/react';
import { Dispatch, MouseEvent, ReactElement, useCallback } from 'react';

import { quickfields } from './models';
import { AllSearchTermsModal } from '@/components/SearchBar/AllSearchTermsModal';
import { SearchInputAction } from '@/components/SearchBar/searchInputReducer';
import { useStore } from '@/store';
import { AppMode } from '@/types';
import { isNil } from 'ramda';
import { useIsClient } from '@/lib/useIsClient';

// Reveal fields as the viewport widens: the first two always show, later ones
// appear at progressively wider breakpoints so trailing fields drop first on
// small screens (the all-terms modal covers anything hidden).
const DISPLAY_FROM: Record<'sm' | 'md' | 'lg' | 'xl', ResponsiveValue<'none' | 'inline-flex'>> = {
  sm: { base: 'none', sm: 'inline-flex' },
  md: { base: 'none', md: 'inline-flex' },
  lg: { base: 'none', lg: 'inline-flex' },
  xl: { base: 'none', xl: 'inline-flex' },
};

const quickfieldDisplay = (index: number): ResponsiveValue<'none' | 'inline-flex'> | undefined => {
  if (index <= 1) {
    return undefined; // always visible
  }
  const order = ['sm', 'md', 'lg', 'xl'] as const;
  return DISPLAY_FROM[order[index - 2] ?? 'xl'];
};

export interface IQuickFieldsProps extends FlexProps {
  isLoading?: boolean;
  dispatch: Dispatch<SearchInputAction>;
}

export const QuickFields = (props: IQuickFieldsProps): ReactElement => {
  const { isLoading, dispatch, ...elProps } = props;

  const mode: AppMode = useStore((state) => state.mode);
  const isClient = useIsClient();
  const items = quickfields[mode] ?? quickfields.default;

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
    <Flex direction="row" justifyContent="start" align="center" fontSize="md" gap={5} {...elProps}>
      <HStack spacing={5} fontSize="md" data-tour="quick-fields">
        <Text whiteSpace="nowrap">QUICK FIELD: </Text>
        {!isClient
          ? null
          : items.map((term, index) => (
              <Button
                key={term.id}
                onClick={handleQFSelect}
                variant="link"
                tabIndex={0}
                data-value={term.value}
                data-cursor={term.cursorPos}
                size="md"
                whiteSpace="nowrap"
                display={quickfieldDisplay(index)}
                data-testid="quickfield"
              >
                {term.title}
              </Button>
            ))}
      </HStack>
      <AllSearchTermsModal onSelect={handleASTSelect} />
    </Flex>
  );
};
