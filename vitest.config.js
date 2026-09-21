import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [...react(), tsconfigPaths()],
  cacheDir: '.vitest',
  test: {
    environment: 'jsdom',
    exclude: [...defaultExclude, '**/e2e/**', '**/.worktrees/**'],
    setupFiles: ['./vitest-setup.ts'],
    isolate: true,
    maxConcurrency: 16,
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: 'lcov',
      // Report only test-touched files; the default is the whole repo.
      all: false,
    },
  },
});
