import { Button, Flex, Text } from '@chakra-ui/react';
import { ReactElement } from 'react';

// Show selected node details
export const NodeDetailPane = ({
  title,
  description,
  content,
  canAddAsFilter,
  onAddToFilter,
  onRemoveFromFilter,
}: {
  title: string;
  description: string;
  content: ReactElement;
  canAddAsFilter: boolean;
  onAddToFilter: () => void;
  onRemoveFromFilter: () => void;
}): ReactElement => {
  return (
    <>
      <Flex direction="column">
        <Flex justifyContent="space-between">
          <Text as="h3" fontSize="xl" fontWeight="bold">
            {title}
          </Text>
          {canAddAsFilter ? (
            <Button w="fit-content" ml={5} variant="outline" onClick={onAddToFilter}>
              Add to filter
            </Button>
          ) : (
            <Button w="fit-content" ml={5} variant="outline" color="red.500" onClick={onRemoveFromFilter}>
              Remove filter
            </Button>
          )}
        </Flex>
        <Text my={2}>{description}</Text>
        {content}
      </Flex>
    </>
  );
};
