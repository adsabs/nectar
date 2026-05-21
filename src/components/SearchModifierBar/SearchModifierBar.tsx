import { Box, BoxProps, Button, Circle, Menu, MenuButton, MenuItem, MenuList, Text, VStack } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useRouter } from 'next/router';
import { omit } from 'ramda';
import { ADS_COMPAT_URL_PARAM, SEARCH_MODE_OPTIONS, SearchMode } from '@/utils/common/searchMode';
import { useSearchMode } from '@/lib/useSearchMode';

interface SearchModifierBarProps extends BoxProps {
  onModeChange?: (mode: SearchMode) => void;
  onNavigate?: (mode: SearchMode) => void;
  isDisabled?: boolean;
}

export const SearchModifierBar = ({ onModeChange, onNavigate, isDisabled, ...boxProps }: SearchModifierBarProps) => {
  const router = useRouter();
  const [storedMode, setStoredMode] = useSearchMode();
  const urlAdsCompat = router.query[ADS_COMPAT_URL_PARAM] === '1';
  const currentMode =
    urlAdsCompat || storedMode === SearchMode.ADS_COMPAT ? SearchMode.ADS_COMPAT : SearchMode.ALL_RELEVANT;
  const currentOption = SEARCH_MODE_OPTIONS.find((o) => o.mode === currentMode) ?? SEARCH_MODE_OPTIONS[0];

  const handleModeChange = (newMode: SearchMode) => {
    setStoredMode(newMode);
    onModeChange?.(newMode);
    if (onNavigate) {
      onNavigate(newMode);
    } else {
      const updatedQuery =
        newMode === SearchMode.ADS_COMPAT
          ? { ...router.query, [ADS_COMPAT_URL_PARAM]: '1' }
          : omit([ADS_COMPAT_URL_PARAM], router.query);
      void router.push({ pathname: router.pathname, query: updatedQuery }, undefined, { shallow: true });
    }
  };

  const modeColor = currentMode === SearchMode.ADS_COMPAT ? 'orange.400' : 'teal.400';

  return (
    <Box {...boxProps}>
      <Menu>
        <MenuButton
          as={Button}
          variant="ghost"
          size="sm"
          leftIcon={<Circle size="8px" bg={modeColor} />}
          rightIcon={<ChevronDownIcon />}
          aria-label={`Search mode: ${currentOption.label}`}
          isDisabled={isDisabled}
        >
          <Text as="span" fontWeight="normal" mr={1} fontSize="sm">
            Search mode:
          </Text>
          <Text as="span" fontWeight="semibold" fontSize="sm">
            {currentOption.label}
          </Text>
        </MenuButton>
        <MenuList>
          {SEARCH_MODE_OPTIONS.map((option) => (
            <MenuItem
              key={option.mode}
              onClick={() => handleModeChange(option.mode)}
              fontWeight={option.mode === currentMode ? 'semibold' : 'normal'}
            >
              <VStack align="start" spacing={0}>
                <Text fontSize="sm">{option.label}</Text>
                <Text fontSize="xs" color="gray.500">
                  {option.helperText}
                </Text>
              </VStack>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};
