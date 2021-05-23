const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  purge: ['./src/pages/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
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
        sans: ['Helvetica', 'Roboto', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // 'ads-base': '#f3f7f9',
        'ads-base': '#ffffff',
        gray: {
          1000: '#1a1a1a',
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
