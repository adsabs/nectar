import type { ThemeConfig } from '@chakra-ui/react';

export const themeConfig: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const themeColors = {
  brand: {
    100: '#f2f2f2',
    200: '#049dd9',
    300: '#5fbfae',
    400: '#97bf41',
    500: '#bfac4b',
  },

  blue: {
    '50': '#EAEDFA',
    '100': '#C5CDF1',
    '200': '#A0ADE8',
    '300': '#7C8DDF',
    '400': '#576DD6',
    '500': '#324DCD',
    '600': '#283EA4',
    '700': '#1E2E7B',
    '800': '#141F52',
    '900': '#0A0F29',
  },
  gray: {
    '50': '#F2F2F2',
    '100': '#DBDBDB',
    '200': '#C4C4C4',
    '300': '#ADADAD',
    '400': '#969696',
    '500': '#808080',
    '600': '#666666',
    '700': '#333333',
    '800': '#1C1C1C',
    '900': '#000000',
  },
};
