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
      // Vitest 3's v8 defaults changed the measurement basis vs 0.34. Restore the
      // prior basis so reported numbers stay comparable across the upgrade:
      //   all:false            -> only test-touched files (v3 default is the whole repo)
      //   ignoreEmptyLines:false -> count blank/comment lines (v3 default drops them)
      all: false,
      ignoreEmptyLines: false,
    },
  },
});
