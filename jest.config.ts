import { Config } from '@jest/types';
import { readdirSync } from 'fs';
import nextJest from 'next/jest';
import { parse, resolve } from 'path';

/**
 * Run through all the files at /src, strip extensions,
 * and create alias entries for each
 */
const getPathAliases = () => {
  const src = resolve(__dirname, 'src');
  const files = readdirSync(src);
  return files.reduce((acc, file) => {
    const { name } = parse(file);
    return {
      ...acc,
      [`^@${name}(.*)`]: `<rootDir>/src/${name}$1`,
    };
  }, {});
};

const createJestConfig = nextJest({
  dir: './',
});

const config: Config.InitialOptions = {
  rootDir: '.',
  moduleNameMapper: {
    ...getPathAliases(),
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/components/__mocks__/fileMock.ts',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  verbose: true,
  moduleDirectories: ['node_modules', '<rootDir>/src/'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  maxConcurrency: 99,
};

module.exports = createJestConfig(config);
