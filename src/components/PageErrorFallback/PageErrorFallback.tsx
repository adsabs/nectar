import {
  Box,
  Button,
  Center,
  Code,
  Container,
  Heading,
  Icon,
  Link,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { ArrowPathIcon, HomeIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';
import { FallbackProps } from 'react-error-boundary';
import { categorizeError, getErrorMessage, isTransientError } from '@/lib/retry';

interface PageErrorFallbackProps extends Partial<FallbackProps> {
  title?: string;
  showTechnicalDetails?: boolean;
  hideHomeButton?: boolean;
}

export const PageErrorFallback = ({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  showTechnicalDetails = process.env.NODE_ENV === 'development',
  hideHomeButton = false,
}: PageErrorFallbackProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconColor = useColorModeValue('red.400', 'red.300');
  const router = useRouter();

  const errorCategory = categorizeError(error);
  const userMessage = getErrorMessage(error);
  const canRetry = isTransientError(error);

  const handleRetry = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary();
    } else {
      router.reload();
    }
  };

  const handleGoHome = () => {
    void router.push('/');
  };

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
          role="alert"
          aria-live="assertive"
        >
          <Icon as={WarningTwoIcon} boxSize={12} color={iconColor} mb={5} />

          <Heading variant="pageTitle" mb={3} size="lg">
            {title}
          </Heading>

          <Text color="gray.500" mb={6}>
            {userMessage}
          </Text>

          <VStack spacing={3} width="100%">
            {canRetry && (
              <Button
                size="md"
                width="full"
                colorScheme="blue"
                leftIcon={<Icon as={ArrowPathIcon} />}
                onClick={handleRetry}
              >
                Try Again
              </Button>
            )}
            {!hideHomeButton && (
              <Button
                size="md"
                width="full"
                variant={canRetry ? 'outline' : 'solid'}
                colorScheme={canRetry ? 'gray' : 'blue'}
                leftIcon={<Icon as={HomeIcon} />}
                onClick={handleGoHome}
              >
                Go to Home
              </Button>
            )}
          </VStack>

          {showTechnicalDetails && error && (
            <Box mt={6} pt={4} borderTopWidth="1px" borderColor={borderColor} textAlign="left">
              <Text fontSize="xs" color="gray.400" mb={2}>
                Technical details ({errorCategory}):
              </Text>
              <Code
                display="block"
                whiteSpace="pre-wrap"
                fontSize="xs"
                p={2}
                borderRadius="sm"
                colorScheme="red"
                maxH="150px"
                overflowY="auto"
              >
                {error.message || String(error)}
              </Code>
            </Box>
          )}

          <Box mt={6} pt={4} borderTopWidth="1px" borderColor={borderColor}>
            <Text fontSize="xs" color="gray.400">
              If this problem persists,{' '}
              <Link fontWeight="semibold" href="/feedback/general">
                contact us
              </Link>
            </Text>
          </Box>
        </Box>
      </Container>
    </Center>
  );
};
