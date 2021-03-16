const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  purge: ['./pages/**/*.{ts,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    container: (theme) => ({
      center: true,
      padding: {
        default: theme('spacing.4'),
        sm: theme('spacing.5'),
        lg: theme('spacing.6'),
        xl: theme('spacing.8'),
      },
    }),
    extend: {
      fontFamily: {
        sans: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'ads-bg': '#f3f7f9',
        gray: {
          1000: '#1a1a1a',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
