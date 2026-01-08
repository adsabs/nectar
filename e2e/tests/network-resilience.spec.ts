import { test, expect } from '@playwright/test';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';

// Dismiss all tour modals
const dismissAllTours = () => {
  localStorage.setItem('seen-landing-tour', 'true');
  localStorage.setItem('seen-results-tour', 'true');
  localStorage.setItem('seen-abstract-tour', 'true');
};

test.describe('Network Resilience', () => {
  test.describe('Offline Indicator', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(dismissAllTours);
    });

    test('shows offline banner when network is disconnected', async ({ page, context }) => {
      await page.goto(NECTAR_URL);
      await expect(page.locator('body')).toBeVisible();

      // Go offline
      await context.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline')));

      // Should show offline banner
      await expect(page.getByText('You are offline. Some features may not be available.')).toBeVisible({
        timeout: 5000,
      });
    });

    test('shows reconnected banner when coming back online', async ({ page, context }) => {
      await page.goto(NECTAR_URL);

      // Go offline first
      await context.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline')));
      await expect(page.getByText('You are offline. Some features may not be available.')).toBeVisible({
        timeout: 5000,
      });

      // Go back online
      await context.setOffline(false);
      await page.evaluate(() => window.dispatchEvent(new Event('online')));

      // Should show reconnected banner
      await expect(page.getByText('You are back online.')).toBeVisible({ timeout: 5000 });
    });

    test('reconnected banner can be manually dismissed', async ({ page, context }) => {
      await page.goto(NECTAR_URL);
      await page.waitForLoadState('networkidle');

      // Go offline then online
      await context.setOffline(true);
      await page.evaluate(() => window.dispatchEvent(new Event('offline')));
      await expect(page.getByText('You are offline. Some features may not be available.')).toBeVisible({
        timeout: 5000,
      });

      await context.setOffline(false);
      await page.evaluate(() => window.dispatchEvent(new Event('online')));

      const reconnectedBanner = page.getByText('You are back online.');
      await expect(reconnectedBanner).toBeVisible({ timeout: 5000 });

      // Click dismiss button
      await page.getByRole('button', { name: 'Dismiss' }).click();

      await expect(reconnectedBanner).not.toBeVisible();
    });
  });

  test.describe('Search Page Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(dismissAllTours);
    });

    test('shows error alert when search API fails with 500', async ({ page }) => {
      // Intercept search API and return 500 for all requests
      await page.route('**/search/query**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: { msg: 'Internal Server Error' } }),
        });
      });

      await page.goto(`${NECTAR_URL}/search?q=test`);

      // Should show "Something went wrong" error message
      await expect(page.getByText('Something went wrong')).toBeVisible({ timeout: 20000 });

      // Should have "Try Again" button
      await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
    });

    test('shows error when search API returns 503 service unavailable', async ({ page }) => {
      await page.route('**/search/query**', (route) => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { msg: 'Service Unavailable' } }),
        });
      });

      await page.goto(`${NECTAR_URL}/search?q=test`);

      // Should show error state with Try Again button
      await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible({ timeout: 20000 });
    });

    test('automatic retry succeeds after transient failures', async ({ page }) => {
      let requestCount = 0;

      await page.route('**/search/query**', (route) => {
        requestCount++;
        if (requestCount <= 2) {
          // First 2 requests fail
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: { msg: 'Internal Server Error' } }),
          });
        } else {
          // 3rd request succeeds (within retry limit)
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              responseHeader: { status: 0 },
              response: {
                numFound: 1,
                start: 0,
                docs: [
                  {
                    bibcode: '2020Test..001A',
                    title: ['Test Article After Retry'],
                    author: ['Test Author'],
                  },
                ],
              },
            }),
          });
        }
      });

      await page.goto(`${NECTAR_URL}/search?q=test`);

      // Automatic retries should eventually succeed and show results
      await expect(page.getByText('Test Article After Retry')).toBeVisible({ timeout: 20000 });
    });
  });

  test.describe('Page Error Boundaries', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(dismissAllTours);
    });

    test('search page handles malformed API response gracefully', async ({ page }) => {
      await page.route('**/search/query**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'not valid json {{{{',
        });
      });

      await page.goto(`${NECTAR_URL}/search?q=test`);

      // Page should still render without crashing
      await expect(page.locator('body')).toBeVisible();

      // Wait for error handling
      await page.waitForTimeout(5000);

      // Should show some form of error handling - navigation should still work
      const navVisible = await page
        .getByRole('navigation')
        .isVisible()
        .catch(() => false);
      const errorVisible = await page
        .getByText(/something went wrong|error/i)
        .first()
        .isVisible()
        .catch(() => false);
      const tryAgainVisible = await page
        .getByRole('button', { name: 'Try Again' })
        .isVisible()
        .catch(() => false);

      // At minimum, navigation should be visible (page didn't completely crash)
      expect(navVisible || errorVisible || tryAgainVisible).toBe(true);
    });
  });
});
