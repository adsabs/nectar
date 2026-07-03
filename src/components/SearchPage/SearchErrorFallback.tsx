import { Alert, AlertIcon, Box, Button, Text } from '@chakra-ui/react';
import { FallbackProps } from 'react-error-boundary';

// error fallback for the search page's error boundaries
export const SearchErrorFallback = ({ label, resetErrorBoundary }: FallbackProps & { label: string }) => (
  <Alert status="error" my={2} borderRadius="md">
    <AlertIcon />
    <Box flex="1">
      <Text>{label}</Text>
    </Box>
    <Button size="sm" colorScheme="blue" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </Alert>
);
