import { Alert, AlertIcon, Text } from '@chakra-ui/react';

// warns that results may be incomplete when the response flags partialResults
export const PartialResultsWarning = ({ isPartialResults }: { isPartialResults?: boolean }) => {
  if (!isPartialResults) {
    return null;
  }

  return (
    <Alert status="warning" mb={1} borderRadius="md">
      <AlertIcon />
      <Text>
        The search took too long, so some results may be missing. Try refining your query to make it faster and see
        everything.
      </Text>
    </Alert>
  );
};
