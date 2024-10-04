import { Button, Flex, HStack, Text } from '@chakra-ui/react';
import { MouseEvent, ReactElement, useCallback } from 'react';

import { quickfields } from './models';
import { useIntermediateQuery } from '@/lib/useIntermediateQuery';
import { AllSearchTermsDropdown } from '@/components/SearchBar/AllSearchTermsDropdown';

export interface IQuickFieldsProps {
  isLoading?: boolean;
}

export const QuickFields = (props: IQuickFieldsProps): ReactElement => {
  const { isLoading } = props;
  const { appendToQuery } = useIntermediateQuery();

  const handleQFSelect = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (!isLoading) {
        const target = e.currentTarget;
        appendToQuery(target.dataset['value']);
      }
    },
    [isLoading],
  );

  const handleASTSelect = useCallback(
    (value: string) => {
      if (!isLoading) {
        appendToQuery(value);
      }
    },
    [isLoading],
  );

  return (
    <Flex direction="row" justifyContent="start" fontSize="md" gap={5}>
      <HStack spacing={5} fontSize="md">
        <Text>QUICK FIELD: </Text>
        {quickfields.map((term) => (
          <Button
            key={term.id}
            onClick={handleQFSelect}
            variant="link"
            tabIndex={0}
            data-value={term.value}
            size="md"
            data-testid="quickfield"
            display={{ base: 'none', sm: 'initial' }}
          >
            {term.title}
          </Button>
        ))}
      </HStack>
      <AllSearchTermsDropdown onSelect={handleASTSelect} />
    </Flex>
  );
};
