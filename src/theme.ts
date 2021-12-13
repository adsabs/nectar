import { extendTheme, ThemeConfig, withDefaultColorScheme } from '@chakra-ui/react';

const theme = extendTheme(
  {
    config: {
      initialColorMode: 'light', // use 'system' when we have dark mode switch
      useSystemColorMode: false,
    } as ThemeConfig,
    colors: {
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
        '700': '#4D4D4D',
        '800': '#333333',
        '900': '#1A1A1A',
      },
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    styles: {
      global: {
        a: {
          color: 'blue.400',
        },
        nav: {
          backgroundColor: 'gray.900',
        },
        footer: {
          backgroundColor: 'gray.900',
        },
        'footer a': {
          color: 'gray.50',
        },
      },
    },
    components: {
      Link: {
        baseStyle: {
          color: 'blue.400',
        },
      },
      Menu: {
        parts: ['button', 'list', 'item'],
        variants: {
          navbar: {
            button: {
              color: 'gray.50',
              fontWeight: 'medium',
              margin: '2',
              _focus: { boxShadow: 'outline' },
            },
            list: {
              zIndex: '20',
            },
          },
        },
      },
      Drawer: {
        parts: ['overlay', 'dialogContainer'],
        variants: {
          navbar: {
            dialog: {
              backgroundColor: 'gray.900',
              color: 'gray.50',
            },
          },
        },
      },
      List: {
        parts: ['item'],
        variants: {
          navbar: {
            item: {
              paddingX: '1',
              paddingY: '1',
              cursor: 'pointer',
              _hover: { background: 'gray.800' },
              _focus: { outline: 'none', boxShadow: 'outline' },
            },
          },
        },
      },
    },
  },
  withDefaultColorScheme({ colorScheme: 'blue' }),
);

export default theme;
