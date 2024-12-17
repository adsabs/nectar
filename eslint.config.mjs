import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
        },
      ],

      '@typescript-eslint/no-empty-function': ['warn', {}],

      '@typescript-eslint/no-empty-interface': [
        'error',
        {
          allowSingleExtends: false,
        },
      ],

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
