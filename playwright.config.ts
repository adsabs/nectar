import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'github' : 'list',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    extraHTTPHeaders: {
      'x-scix-ci': 'true',
    },
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    bypassCSP: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-angle=gl-egl', '--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist'],
        },
      },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  webServer: [
    {
      env: {
        BASE_CANONICAL_URL: process.env.BASE_CANONICAL_URL || 'https://ui.adsabs.harvard.edu',
        API_HOST_CLIENT: process.env.API_HOST_CLIENT || 'https://devapi.adsabs.harvard.edu/v1',
        API_HOST_SERVER: process.env.API_HOST_SERVER || 'https://devapi.adsabs.harvard.edu/v1',
        COOKIE_SECRET: process.env.COOKIE_SECRET || 'secret_secret_secret_secret_secret',
        ADS_SESSION_COOKIE_NAME: process.env.ADS_SESSION_COOKIE_NAME || 'ads_session',
        SCIX_SESSION_COOKIE_NAME: process.env.SCIX_SESSION_COOKIE_NAME || 'scix_session',
      },
      command: 'pnpm run dev:mocks',
      // 5 minute timeout
      timeout: 300000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
      url: 'http://localhost:8000',
    },
  ],
});
