import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup.ts'],
    isolate: true,
    threads: true,
    coverage: {
      reporter: 'lcov',
    },
  },
  resolve: {
    alias: {
      "react/jsx-dev-runtime.js": resolve(__dirname, "node_modules/react/jsx-dev-runtime.js"),
      "react/jsx-runtime.js": resolve(__dirname, "node_modules/react/jsx-runtime.js")
    }
  }
});
