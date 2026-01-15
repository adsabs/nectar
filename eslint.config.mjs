import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
        },
      ],

      '@typescript-eslint/no-empty-function': ['warn', {}],

      '@typescript-eslint/no-empty-object-type': ['warn'],
      curly: ['warn', 'all'],

      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowTernary: true,
          enforceForJSX: true,
        },
      ],

      // Disable React Compiler rules (not using React Compiler)
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/incompatible-library': 'off',

      // Keep exhaustive-deps as warning (matching previous behavior)
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
