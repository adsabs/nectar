const base = require('../../eslint.config.js');

module.exports = [
  ...base,
  {
    files: ['types.d.ts', 'next-env.d.ts', '**/*.ts', '**/*.tsx', 'vitest-setup.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', 'build'],
  },
];
