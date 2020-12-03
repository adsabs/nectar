const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
    standardFontWeights: true,
  },
  purge: {
    mode: 'all',
    content: ['./src/components/**/*.tsx', './src/pages/**/*.tsx'],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        gray: {
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
      },
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/ui'), require('@tailwindcss/custom-forms')],
  corePlugins: {
    float: false,
  },
};
