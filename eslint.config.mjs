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
    },
  },
];
