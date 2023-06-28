import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [...react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    isolate: true,
    threads: true,
    minThreads: 8,
    maxConcurrency: 16,
    globals: false,
    cache: {
      dir: '.vitest',
    },
    coverage: {
      provider: 'c8',
      reporter: 'lcov',
    },
    deps: {
      fallbackCJS: true,
    },
  },
  resolve: {
    alias: {
      'react/jsx-dev-runtime.js': resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      'react/jsx-runtime.js': resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
    },
  },
});
