import { Button, Flex, HStack, Text } from '@chakra-ui/react';
import { memo, MouseEvent, ReactElement } from 'react';
import { AllSearchTermsDropdown } from './AllSearchTermsDropdown';
import { quickfields } from './models';

export interface IQuickFieldsProps {
  onSelect: (value: string) => void;
}

export const QuickFields = memo(
  ({ onSelect }: IQuickFieldsProps): ReactElement => {
    const handleQFSelect = (e: MouseEvent<HTMLElement>) => {
      const target = e.currentTarget;
      onSelect(target.dataset['value']);
    };

    const handleASTSelect = (value: string) => {
      onSelect(value);
    };

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
  },
  (prev, next) => {
    return prev.onSelect === next.onSelect;
  },
);
