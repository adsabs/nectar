// EXPERIMENTAL (SCIX-904): throwaway instrumentation — remove with the scix_id migration.
import { Badge, Box, Button, Flex, Stack, Text } from '@chakra-ui/react';
import { useState } from 'react';

import { useColorModeColors } from '@/lib/useColorModeColors';
import { isScixIdDebugEnabled, useScixIdFallbacks } from '@/lib/scix-id/fallbackStore';

export const ScixIdFallbackHud = () => {
  const colors = useColorModeColors();
  const { entries, clear } = useScixIdFallbacks();
  const [isOpen, setIsOpen] = useState(false);

  if (!isScixIdDebugEnabled()) {
    return null;
  }

  return (
    <Box position="fixed" bottom="4" right="4" zIndex="tooltip" fontSize="xs">
      <Button
        size="xs"
        colorScheme="orange"
        aria-label={`scix_id fallbacks: ${entries.length} distinct`}
        onClick={() => setIsOpen((open) => !open)}
      >
        scix_id fallbacks
        <Badge ml="2" colorScheme="red" borderRadius="full">
          {entries.length}
        </Badge>
      </Button>
      {isOpen && (
        <Box
          mt="2"
          p="3"
          maxW="sm"
          maxH="sm"
          overflowY="auto"
          borderWidth="1px"
          borderColor={colors.border}
          backgroundColor={colors.background}
          color={colors.text}
          borderRadius="md"
          boxShadow="lg"
        >
          <Flex justifyContent="space-between" alignItems="center" mb="2">
            <Text fontWeight="bold">Forced bibcode fallbacks</Text>
            <Button size="xs" variant="ghost" onClick={clear}>
              clear
            </Button>
          </Flex>
          {entries.length === 0 ? (
            <Text color={colors.lightText}>None recorded yet.</Text>
          ) : (
            <Stack spacing="1">
              {entries.map((entry) => (
                <Text key={`${entry.surface}|${entry.reason}`}>
                  {entry.surface} · {entry.reason}
                  {entry.count > 1 ? ` ×${entry.count}` : null}
                </Text>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
};
