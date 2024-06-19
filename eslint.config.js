const eslintPluginImport = require('eslint-plugin-import');
const eslintPluginJsxA11y = require('eslint-plugin-jsx-a11y');
const eslintPluginStorybook = require('eslint-plugin-storybook');
const eslintPluginReactHooks = require('eslint-plugin-react-hooks');
const eslintPluginSimpleImportSort = require('eslint-plugin-simple-import-sort');
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const globals = require('globals');
const eslintPluginReact = require('eslint-plugin-react');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['eslint.config.js', '**/eslint.config.js'],
  },
  js.configs.recommended,
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:storybook/recommended',
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
    'prettier',
  ),
  {
    plugins: {
      ['simple-import-sort']: eslintPluginSimpleImportSort,
      ['react']: eslintPluginReact,
      ['react-hooks']: eslintPluginReactHooks,
      ['storybook']: eslintPluginStorybook,
      ['jsx-a11y']: eslintPluginJsxA11y,
      ['import']: eslintPluginImport,
    },
  },
  {
    settings: {
      next: { rootDir: 'apps/client/' },
      react: { version: 'detect' },
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2020,
        jsx: true,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: ['tsconfig.base.json', 'apps/*/tsconfig.app.json'],
        allowAutomaticSingleRunInference: true,
        cacheLifetime: { glob: 'Infinity' },
      },
      globals: {
        es2020: true,
        node: true,
        ...globals.browser,
      },
    },
  },
  {
    rules: {
      // Enforce consistent brace style for all control statements
      curly: ['warn', 'all'],

      // Disallow unnecessary boolean casts
      'no-extra-boolean-cast': 'warn',

      // Disallow declaring variables inside case/default clauses
      'no-case-declarations': 'warn',

      // Disallow unused variables
      'no-unused-vars': 'off',

      // Enforce rules of hooks in React (must be called at the top level)
      'react-hooks/rules-of-hooks': 'error',

      // Disable the rule that requires React to be in scope when using JSX
      'react/react-in-jsx-scope': 'off',

      // Disable the rule that enforces React import in JSX
      'react/jsx-uses-react': 'off',

      // Disallow autoFocus attribute on elements
      'jsx-a11y/no-autofocus': 'warn',

      // Prevent invalid characters from appearing in markup
      'react/no-unescaped-entities': 'warn',

      // Prevent passing children as props
      'react/no-children-prop': 'warn',

      // Prevent missing displayName in a React component definition
      'react/display-name': 'warn',

      // Disable prop-types checking in React components
      'react/prop-types': 'off',

      // Enforce the use of keys in React elements within iterables
      'react/jsx-key': 'warn',

      // Warn against empty functions
      '@typescript-eslint/no-empty-function': ['warn'],

      // Warn against floating promises (promises that are not awaited or returned)
      '@typescript-eslint/no-floating-promises': ['warn', { ignoreIIFE: true }],

      // Disallow empty interfaces
      '@typescript-eslint/no-empty-interface': ['error', { allowSingleExtends: false }],

      // Disallow calling methods of an object that may be undefined
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],

      // Disable the rule that disallows unused variables in TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],

      // Prevent misusing promises (e.g., floating promises)
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],

      // Warn against unsafe assignment of any type
      '@typescript-eslint/no-unsafe-assignment': 'warn',

      // Warn against unsafe member access on any type
      '@typescript-eslint/no-unsafe-member-access': 'off',

      // Restrict the usage of template expressions to specific types
      '@typescript-eslint/restrict-template-expressions': 'warn',

      // Warn against functions that return a promise but are missing the async keyword
      '@typescript-eslint/require-await': 'warn',

      // Warn against potentially unsafe function calls
      '@typescript-eslint/no-unsafe-call': 'off',

      // Warn against using type assertions in object literals
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      // Disable the preference for default imports
      'import/prefer-default-import': 'off',

      // Warn about sort order on imports
      'simple-import-sort/imports': 'warn',

      // Warn about sort order on exports
      'simple-import-sort/exports': 'warn',
    },
  },
];
