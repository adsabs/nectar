import { Box, Flex, Switch, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { ADS_MODE_BLURB } from '@/lib/adsMode';
import { useAdsMode } from '@/lib/useAdsMode';
import { useIsClient } from '@/lib/useIsClient';

type AdsModeToggleProps = {
  source: 'navbar' | 'account_menu';
  showDescription?: boolean;
  onToggle?: () => void;
};

export const AdsModeToggle: FC<AdsModeToggleProps> = ({ source, showDescription = false, onToggle }) => {
  const { active, toggle } = useAdsMode();
  const isClient = useIsClient();

  const handleToggle = () => {
    toggle(source);
    onToggle?.();
  };

  if (!isClient) {
    return null;
  }

  if (!active && source === 'navbar') {
    return null;
  }

  return (
    <Box data-testid={`ads-mode-toggle-${source}`}>
      <Flex alignItems="center" gap={2}>
        <Text fontWeight="semibold" color={source === 'navbar' ? 'white' : 'auto'} fontSize={{ base: 'sm', md: 'sm' }}>
          ADS mode
        </Text>
        {source === 'navbar' ? null : (
          <Switch
            size="sm"
            colorScheme="blue"
            isChecked={active}
            onChange={handleToggle}
            aria-label="Toggle ADS mode"
          />
        )}
        <Box
          px={2}
          py={0.5}
          borderRadius="full"
          bg={active ? 'blue.800' : 'gray.700'}
          color="gray.50"
          fontSize="xs"
          fontWeight="semibold"
        >
          {active ? 'On' : 'Off'}
        </Box>
      </Flex>
      {showDescription ? (
        <Text fontSize="xs" color="gray.500" mt={1} maxW="320px">
          {ADS_MODE_BLURB}
        </Text>
      ) : null}
    </Box>
  );
};
