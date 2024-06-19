import { extendTheme, StyleFunctionProps, ThemeConfig, withDefaultSize } from '@chakra-ui/react';
import { mode } from '@chakra-ui/theme-tools';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

export const theme = extendTheme(
  {
    config,
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
        '700': '#303130',
        '800': '#1C1C1C',
        '900': '#000000',
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
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    styles: {
      global: (props: StyleFunctionProps) => ({
        'html, body': {
          color: mode('gray.600', 'white')(props),
          fontSize: 'md',
          fontWeight: 'normal',
          backgroundColor: mode('white', 'gray.800')(props),
        },
        a: {
          color: mode('blue.400', 'blue.200')(props),
        },
      }),
    },
    components: {
      Heading: {
        variants: {
          abstract: {
            fontSize: '2xl',
          },
          pageTitle: {
            fontSize: '2xl',
          },
        },
      },
      Link: (props: StyleFunctionProps) => ({
        baseStyle: {
          color: mode('blue.400', 'blue.200')(props),
        },
        variants: {
          footer: {
            color: 'gray.50',
          },
          dropdownItem: {
            color: mode('gray.700', 'whiteAlpha.900')(props),
            _hover: { textDecoration: 'none' },
            _focus: { textDecoration: 'none', boxShadow: 'none' },
          },
        },
      }),
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
          accordion: (props: StyleFunctionProps) => ({
            item: {
              paddingX: '1',
              paddingY: '1',
              color: mode('gray.700', 'whiteAlpha.900')(props),
              _focus: { outline: 'none', boxShadow: 'outline' },
            },
          }),
          autocomplete: {
            container: {
              zIndex: '10',
              marginTop: '1',
              left: '1',
              width: 'full',
              maxHeight: '64',
              backgroundColor: 'white',
              borderRadius: 'sm',
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
      Accordion: {
        parts: ['container', 'button'],
        variants: {
          'abs-resources': {
            container: {
              borderWidth: 0.5,
              borderRadius: 5,
              marginTop: 1,
            },
            button: {
              fontWeight: 'md',
            },
          },
        },
      },
      FormLabel: {
        baseStyle: {
          fontWeight: 'bold',
        },
      },
      Input: {
        parts: ['field', 'addon'],
        sizes: {
          lg: {
            field: {
              borderRadius: 'sm',
            },
          },
          md: {
            field: {
              borderRadius: 'sm',
            },
          },
          sm: {
            field: {
              borderRadius: 'sm',
            },
          },
          xs: {
            field: {
              borderRadius: 'sm',
            },
          },
        },
      },
      Textarea: {
        sizes: {
          lg: {
            borderRadius: 'sm',
          },
          md: {
            borderRadius: 'sm',
          },
          sm: {
            borderRadius: 'sm',
          },
          xs: {
            borderRadius: 'sm',
          },
        },
      },
      Text: {
        variants: {
          disabledLink: {
            color: 'blue.200',
          },
        },
      },
      Button: {
        variants: {
          page: {
            borderWidth: '1px',
            borderRadius: '0',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
          },
          pageCurrent: {
            borderWidth: '1px',
            borderRadius: '0',
            borderColor: 'blue.500',
            backgroundColor: 'blue.50',
            zIndex: '5',
          },
          pagePrev: {
            borderWidth: '1px',
            borderRadius: '5px 0 0 5px',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
          },
          pageBetween: {
            borderWidth: '1px',
            borderRadius: '0 0 0 0',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
          },
          pageNext: {
            borderWidth: '1px',
            borderRadius: '0 5px 5px 0',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
          },
          warning: {
            backgroundColor: 'red.500',
            color: 'gray.50',
          },
          pageLoading: {
            borderWidth: '1px',
            borderColor: 'gray.200',
            backgroundColor: 'transparent',
            color: 'gray.700',
          },
        },
        defaultProps: {
          colorScheme: 'blue',
        },
      },
      Select: {
        parts: ['field'],
        baseStyle: {
          field: {
            borderRadius: 'sm',
          },
        },
      },
      Slider: {
        parts: ['thumb'],
        baseStyle: {
          thumb: {
            borderColor: 'gray.200',
            borderRadius: '5px',
          },
        },
      },
      Modal: {
        baseStyle: (props: StyleFunctionProps) => ({
          dialog: {
            bg: mode('whiteAlpha.900', 'gray.800')(props),
          },
        }),
      },
      Tabs: {
        parts: ['tab'],
        baseStyle: {
          thumb: {
            borderColor: 'gray.200',
            borderRadius: '5px',
          },
        },
      },
    },
  },
  // withDefaultColorScheme({ colorScheme: 'blue' }),
  withDefaultSize({
    size: 'sm',
    components: ['Button', 'IconButton', 'Table'],
  }),
  withDefaultSize({
    size: 'md',
    components: ['Input', 'Textarea', 'Select'],
  }),
);
