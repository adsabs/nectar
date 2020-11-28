import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  verbose: true,
  roots: ['components'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests?__/.*|(\\.|/)(test|spec))\\.tsx?$',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
};

export default config;
