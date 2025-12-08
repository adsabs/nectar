import React from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Icon,
  Code,
  Link,
  useColorModeValue,
  Center,
  Container,
} from '@chakra-ui/react';
import { WarningTwoIcon, AddIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import * as Sentry from '@sentry/nextjs';

interface RecordNotFoundProps {
  recordId: string;
  onAddRecord?: () => void;
  onFeedback?: () => void;
}

export const RecordNotFound = ({ recordId, onAddRecord, onFeedback }: RecordNotFoundProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const iconColor = 'brand.500';
  const router = useRouter();

  const handleAddRecord = () => {
    Sentry.captureMessage('record_not_found_add_missing', {
      level: 'info',
      contexts: { recordNotFound: { recordId } },
    });
    if (onAddRecord) {
      onAddRecord();
      return;
    }
    void router.push('/feedback/missingrecord');
  };

  const handleFeedback = () => {
    Sentry.captureMessage('record_not_found_feedback', {
      level: 'info',
      contexts: { recordNotFound: { recordId } },
    });
    if (onFeedback) {
      onFeedback();
      return;
    }
    void router.push('/feedback/general');
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
          role="status"
          aria-live="polite"
        >
          <Icon as={WarningTwoIcon} boxSize={12} color={iconColor} mb={5} />

          <Heading variant="pageTitle" mb={3}>
            Record Not Found
          </Heading>

          <Text color="gray.500" mb={6}>
            We could not locate a record with ID{' '}
            <Code colorScheme="yellow" fontWeight="bold" fontSize="sm">
              {recordId || 'N/A'}
            </Code>
            . It might be a typo or the record may not exist.
          </Text>

          <VStack spacing={3} width="100%">
            <Button size="md" width="full" colorScheme="blue" leftIcon={<AddIcon />} onClick={handleAddRecord}>
              Missing Record?
            </Button>
          </VStack>

          <Box mt={8} pt={4} borderTopWidth="1px" borderColor={borderColor}>
            <Text fontSize="xs" color="gray.400">
              Need help?{' '}
              <Link fontWeight="semibold" href="/feedback/general" onClick={handleFeedback}>
                Tell us more
              </Link>
            </Text>
          </Box>
        </Box>
      </Container>
    </Center>
  );
};
