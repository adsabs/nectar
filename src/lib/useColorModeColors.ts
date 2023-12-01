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
        panel: 'gray.50',
        panelHighlight: 'blue.500',
        lightText: 'gray.500',
      }
    : {
        background: 'gray.800',
        text: 'gray.50',
        link: 'blue.200',
        highlightBackground: 'blue.200',
        highlightForeground: 'white',
        border: 'gray.400',
        panel: 'gray.700',
        panelHighlight: 'blue.200',
        lightText: 'gray.200',
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
        pill: 'var(--chakra-colors-blue-100)',
        pillText: 'var(--chakra-colors-gray-800)',
      }
    : {
        background: 'var(--chakra-colors-gray-800)',
        text: 'var(--chakra-colors-gray-50)',
        link: 'var(--chakra-colors-blue-200)',
        highlightBackground: 'var(--chakra-colors-blue-200)',
        highlightForeground: 'var(--chakra-colors-white)',
        border: 'var(--chakra-colors-gray-400)',
        pill: 'var(--chakra-colors-blue-200)',
        pillText: 'var(--chakra-colors-white)',
      };
};
