import { useColorMode } from '@chakra-ui/react';

export const useColorModeColors = () => {
  const { colorMode } = useColorMode();

  return colorMode === 'light'
    ? {
        background: 'white',
        text: 'gray.700',
        link: 'blue.400',
        highlightBackground: 'blue.100',
        highlightForeground: 'gray.800',
        border: 'gray.100',
      }
    : {
        background: 'gray.800',
        text: 'gray.50',
        link: 'blue.200',
        highlightBackground: 'blue.200',
        highlightForeground: 'white',
        border: 'gray.100',
      };
};

export const useColorModeColorVars = () => {
  const { colorMode } = useColorMode();

  return colorMode === 'light'
    ? {
        background: 'var(--chakra-colors-white)',
        text: 'var(--chakra-colors-gray-700)',
        link: 'var(--chakra-colors-blue-400)',
        highlightBackground: 'var(--chakra-colors-blue-100)',
        highlightForeground: 'var(--chakra-colors-gray-800)',
        border: 'var(--chakra-colors-gray-100)',
      }
    : {
        background: 'var(--chakra-colors-gray-800)',
        text: 'var(--chakra-colors-gray-50)',
        link: 'var(--chakra-colors-blue-200)',
        highlightBackground: 'var(--chakra-colors-blue-200)',
        highlightForeground: 'var(--chakra-colors-white)',
        border: 'var(--chakra-colors-gray-100)',
      };
};
