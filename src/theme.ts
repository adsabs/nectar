import {
  extendTheme,
  ThemeComponentProps,
  ThemeConfig,
  withDefaultColorScheme,
  withDefaultSize,
} from '@chakra-ui/react';

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
    fontSizes: {
      xs: '0.75rem',
      sm: '0.8rem',
      md: '0.95rem',
      lg: '1rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
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
        'html, body': {
          color: 'gray.700',
          fontSize: 'md',
        },
        a: {
          color: 'blue.400',
        },
        footer: {
          backgroundColor: 'gray.900',
          color: 'gray.50',
        },
        'footer a': {
          color: 'gray.50',
        },
      },
    },
    components: {
      Heading: {
        variants: {
          abstract: {
            fontSize: '2xl',
          },
        },
      },
      Link: {
        baseStyle: {
          color: 'blue.500',
        },
        variants: {
          footer: {
            color: 'gray.50',
          },
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
          compact: {
            list: {
              zIndex: '20',
              fontSize: 'sm',
              width: 'auto',
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
        parts: ['container', 'item'],
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
          autocomplete: {
            container: {
              zIndex: '10',
              marginTop: '1',
              left: '1',
              width: 'full',
              maxHeight: '64',
              backgroundColor: 'white',
              borderRadius: 'md',
              shadow: 'md',
              overflowY: 'scroll',
              ring: '1',
              ringColor: 'gray.100',
              marginX: '0',
            },
            item: {
              paddingX: '2',
              paddingY: '2',
              cursor: 'pointer',
              color: 'gray.700',
              _focus: { outline: 'none', boxShadow: 'outline', backgroundColor: 'gray.100' },
            },
          },
        },
      },
      FormLabel: {
        baseStyle: {
          fontWeight: 'bold',
          fontSize: 'sm',
        },
      },
      Input: {
        parts: ['field'],
        variants: {
          outline: (props: ThemeComponentProps) => ({
            field: {
              backgroundColor: props.colorMode === 'light' ? 'white' : 'black',
            },
          }),
        },
      },
      Textarea: {
        variants: {
          outline: (props: ThemeComponentProps) => ({
            backgroundColor: props.colorMode === 'light' ? 'white' : 'black',
          }),
        },
      },
      Button: {
        variants: {
          page: {
            borderWidth: '1px',
            borderRadius: '0',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
            color: 'gray.700',
          },
          pageCurrent: {
            borderWidth: '1px',
            borderRadius: '0',
            borderColor: 'blue.500',
            backgroundColor: 'blue.50',
            color: 'gray.700',
            zIndex: '5',
          },
          pagePrev: {
            borderWidth: '1px',
            borderRadius: '5px 0 0 5px',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
            color: 'gray.700',
          },
          pageNext: {
            borderWidth: '1px',
            borderRadius: '0 5px 5px 0',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
            color: 'gray.700',
          },
        },
      },
    },
  },
  withDefaultColorScheme({ colorScheme: 'blue' }),
  withDefaultSize({
    size: 'sm',
    components: ['Input', 'Checkbox', 'Radio', 'Textarea', 'Button', 'IconButton', 'Table'],
  }),
);

export default theme;
