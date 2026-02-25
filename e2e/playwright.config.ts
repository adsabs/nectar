import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : '50%',
  reporter: 'list',
  timeout: process.env.CI ? 90000 : 30000,

  // Warm the Next.js dev server compilation cache before tests run.
  // First requests trigger on-demand compilation that can exceed action
  // timeouts on slow CI runners.
  globalSetup: process.env.CI ? './global-setup.ts' : undefined,

  use: {
    baseURL: BASE_URL,
    actionTimeout: process.env.CI ? 60000 : 15000,
    navigationTimeout: process.env.CI ? 90000 : 30000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-gl=egl'],
        },
      },
    },
  ],
});
