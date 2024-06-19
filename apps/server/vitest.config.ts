import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    reporters: ['verbose'],
    include: ['src/**/*.test.ts'],
  },
});
