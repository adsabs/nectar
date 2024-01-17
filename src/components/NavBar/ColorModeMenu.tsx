import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Flex, IconButton, Switch, Tooltip, useColorMode } from '@chakra-ui/react';

export const ColorModeMenu = ({ type }: { type: 'icon' | 'switch' }) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <>
      {type === 'icon' ? (
        <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton
            size="xs"
            onClick={toggleColorMode}
            color={colorMode === 'light' ? 'gray.50' : 'gray.800'}
            backgroundColor={colorMode === 'light' ? 'gray.800' : 'gray.50'}
            border="1px solid"
            aria-label="toggle dark mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          />
        </Tooltip>
      ) : (
        <Flex m={4} justifyContent="space-between">
          Dark Mode <Switch isChecked={colorMode === 'dark'} onChange={toggleColorMode} aria-label="dark mode switch" />
        </Flex>
      )}
    </>
  );
};
