import { expect, test } from '@playwright/test';

test.describe.configure({
  mode: 'parallel',
});

test('Basic Search Workflows', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('search-input').fill('identifier:1985ARA&A..23..169D');
  await page.getByTestId('search-input').press('Enter');
  await page.waitForURL('/search?q=identifier%3A1985ARA%26A..23..169D&sort=score+desc&sort=date+desc&p=1', {
    waitUntil: 'load',
  });
  await page.getByRole('link', { name: 'Radio emission from the sun and stars.' }).click();
  await page.waitForURL('/abs/1985ARA&A..23..169D/abstract', { waitUntil: 'load' });
  await page.getByRole('button', { name: 'Full Text Sources' }).click();
  await page.getByRole('menuitem', { name: 'ADS PDF' }).click();
});
