import { expect, test } from '@playwright/test';

test('Landing Pages', async ({ page }) => {
  await page.goto('http://localhost:8000/');
  await expect(page).toHaveTitle(/NASA Science Explorer/);
  await expect(page).toHaveScreenshot('modern-form.png', { fullPage: true, timeout: 10000 });
});
