import { Box, Button, Center, Code, Container, Heading, Icon, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';

interface ServiceUnavailableProps {
  recordId: string;
  statusCode?: number;
}

export const ServiceUnavailable = ({ recordId, statusCode }: ServiceUnavailableProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const router = useRouter();

  return (
    <Center minH="400px" p={4}>
      <Container maxW="lg">
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="sm"
          boxShadow="md"
          p={8}
          textAlign="center"
          role="status"
          aria-live="polite"
        >
          <Icon as={WarningIcon} boxSize={12} color="orange.500" mb={5} />

          <Heading variant="pageTitle" mb={3}>
            Temporarily Unavailable
          </Heading>

          <Text color="gray.500" mb={4}>
            We&apos;re having trouble loading record{' '}
            <Code colorScheme="yellow" fontWeight="bold" fontSize="sm">
              {recordId || 'N/A'}
            </Code>
            . The service is temporarily unavailable.
          </Text>

          <Text color="gray.500" mb={6} fontSize="sm">
            This is usually temporary. Please try again in a moment.
          </Text>

          <VStack spacing={3} width="100%">
            <Button size="md" width="full" colorScheme="blue" onClick={() => router.reload()}>
              Try Again
            </Button>
            <Button size="md" width="full" variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </VStack>

          {statusCode ? (
            <Box mt={6} pt={4} borderTopWidth="1px" borderColor={borderColor}>
              <Text fontSize="xs" color="gray.400">
                Error code: {statusCode}
              </Text>
            </Box>
          ) : null}
        </Box>
      </Container>
    </Center>
  );
};
