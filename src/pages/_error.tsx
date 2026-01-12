import * as Sentry from '@sentry/nextjs';
import type { NextPage, NextPageContext } from 'next';
import type { ErrorProps } from 'next/error';
import NextError from 'next/error';
import { Box, Button, Center, Container, Heading, Icon, Link, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { ArrowPathIcon, HomeIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/router';

interface CustomErrorProps extends ErrorProps {
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

const getErrorMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 404:
      return 'The page you are looking for could not be found.';
    case 500:
      return 'The server encountered an unexpected error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The service is temporarily unavailable. Please try again in a moment.';
    default:
      return 'An unexpected error occurred.';
  }
};

const getErrorTitle = (statusCode: number): string => {
  switch (statusCode) {
    case 404:
      return 'Page Not Found';
    case 500:
      return 'Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    case 504:
      return 'Gateway Timeout';
    default:
      return 'Error';
  }
};

const CustomErrorComponent: NextPage<CustomErrorProps> = ({ statusCode }) => {
  const router = useRouter();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconColor = useColorModeValue('red.400', 'red.300');

  const canRetry = statusCode >= 500;

  const handleRetry = () => {
    router.reload();
  };

  const handleGoHome = () => {
    void router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <Center minH="100vh" p={4}>
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

          <Text fontSize="6xl" fontWeight="bold" color="gray.300" mb={2}>
            {statusCode}
          </Text>

          <Heading variant="pageTitle" mb={3} size="lg">
            {getErrorTitle(statusCode)}
          </Heading>

          <Text color="gray.500" mb={6}>
            {getErrorMessage(statusCode)}
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
            <Button size="md" width="full" variant="ghost" onClick={handleGoBack}>
              Go Back
            </Button>
          </VStack>

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

CustomErrorComponent.getInitialProps = async (contextData: NextPageContext) => {
  await Sentry.captureUnderscoreErrorException(contextData);
  return NextError.getInitialProps(contextData);
};

export default CustomErrorComponent;
