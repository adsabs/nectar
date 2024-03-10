import { defineConfig, devices } from '@playwright/test';

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
    actionTimeout: 0,

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${process.env.PORT || 8000}`,
    bypassCSP: true,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    video: process.env.CI ? 'off' : 'on',
    headless: true,
  },

  /* Configure projects for major browsers */
  projects: [
    { name: 'auth-setup', testMatch: /auth.setup\.ts/ },
    {
      name: 'logged-out-chrome',
      testMatch: '**/*.spec.ts',
      testIgnore: '**/authenticated/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'logged-in-chrome',
      testMatch: '**/authenticated/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user1.json',
      },
      dependencies: ['auth-setup'],
    },
  ],
  webServer: [
    {
      command: 'node server.js',
      timeout: 300000,
      stdout: 'ignore',
      stderr: 'ignore',
      url: 'http://localhost:8000',
    },
    // {
    //   command: 'pnpm storybook dev --ci --quiet --disable-telemetry --port 8001',
    //   timeout: 300000,
    //   stdout: 'ignore',
    //   stderr: 'pipe',
    //   reuseExistingServer: !process.env.CI,
    //   url: 'http://localhost:8001',
    // },
    // {
    //   env: {
    //     BASE_CANONICAL_URL: process.env.BASE_CANONICAL_URL || 'https://ui.adsabs.harvard.edu',
    //     API_HOST_CLIENT: process.env.API_HOST_CLIENT || 'https://devapi.adsabs.harvard.edu/v1',
    //     API_HOST_SERVER: process.env.API_HOST_SERVER || 'https://devapi.adsabs.harvard.edu/v1',
    //     COOKIE_SECRET: process.env.COOKIE_SECRET || 'secret_secret_secret_secret_secret',
    //     ADS_SESSION_COOKIE_NAME: process.env.ADS_SESSION_COOKIE_NAME || 'ads_session',
    //     SCIX_SESSION_COOKIE_NAME: process.env.SCIX_SESSION_COOKIE_NAME || 'scix_session',
    //   },
    //   command: 'node dist/server.js',
    //   // 5 minute timeout
    //   timeout: 300000,
    //   reuseExistingServer: !process.env.CI,
    //   stdout: 'ignore',
    //   stderr: 'pipe',
    //   url: 'http://localhost:8000',
    // },
    // {
    //   command: `PORT=${process.env.PORT || 8000} node dist/standalone/server.js`,
    //   url: `http://localhost:${process.env.PORT || 8000}`,
    //   timeout: 5 * 60 * 1000,
    //   stdout: 'pipe',
    //   stderr: 'pipe',
    // },
  ],
});
