import { Box, Button, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react';
import { SimpleLink } from '@/components/SimpleLink';
import { ReactElement } from 'react';

export interface EmptyStatePanelAction {
  label: string;
  href: string;
}

export interface EmptyStatePanelProps {
  title: string;
  description: string;
  primaryAction?: EmptyStatePanelAction;
  secondaryAction?: EmptyStatePanelAction;
}

export const EmptyStatePanel = ({
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStatePanelProps): ReactElement => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="base"
      p={6}
      mt={4}
      role="region"
      aria-label={title}
    >
      <VStack spacing={4} align="start">
        <Heading as="h2" size="md">
          {title}
        </Heading>
        <Text color="gray.500">{description}</Text>
        {(primaryAction || secondaryAction) && (
          <VStack spacing={2} align="start" pt={2}>
            {primaryAction && (
              <Button as={SimpleLink} href={primaryAction.href} colorScheme="blue" size="sm">
                {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button as={SimpleLink} href={secondaryAction.href} variant="outline" size="sm" colorScheme="gray">
                {secondaryAction.label}
              </Button>
            )}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};
