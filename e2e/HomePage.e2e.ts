import { expect, test } from '@playwright/test';

test('Home Page Load Test', async ({ page }) => {
  await page.goto('http://localhost:8000');
  await expect(page).toHaveTitle(/SciXplorer/);
});
