// back button should go to whereever it came from
import { expect, test } from '@playwright/test';

test('Back button goes to landing page', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByTestId('lib-back-btn').click();
  await page.waitForURL('**/user/libraries');
  expect(page.url()).toMatch(/^.*\/user\/libraries$/);
});

test('Library metadata are correct', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await expect(page.getByLabel('private')).toBeVisible();
  await expect(page.getByLabel('SciX Public Library')).toBeHidden();
  await expect(page.getByTestId('lib-title')).toHaveText('001');
  await expect(page.getByTestId('lib-desc')).toHaveText('001');

  const metadata = page.getByTestId('lib-meta').locator('tbody td');
  await expect(metadata.nth(0)).toHaveText('Found 10 of 10');
  await expect(metadata.nth(1)).toHaveText('ads.user.20');
  await expect(metadata.nth(2)).toHaveText('4/15/2019, 7:03:15 PM');
  await expect(metadata.nth(3)).toHaveText('4/1/2021, 3:11:10 PM');

  await expect(page.getByLabel('Results').getByRole('article')).toHaveCount(10);
});

test('Click on view library as search results goes to search', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByText('View as Search Results').click();
  await page.waitForURL('**/search**');
  expect(page.url()).toMatch(/^.*\/search\?q=docs\(library%2F001\).*/);
});

test('Delete selected docs from library', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByTestId('document-checkbox').nth(1).check();
  await page.getByTestId('document-checkbox').nth(2).check();

  await page.getByTestId('del-selected-btn').click();
  await expect(page.getByLabel('Results').getByRole('article')).toHaveCount(8);
});

test('Delete all docs from library', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByTestId('select-all-checkbox').check();

  await page.getByTestId('del-selected-btn').click();
  await expect(page.getByLabel('Results').getByRole('article')).toHaveCount(0);
});

test('Public library view should have correct metadata', async ({ page }) => {
  await page.goto('/public-libraries/001', { timeout: 60000 });

  await expect(page.getByLabel('private')).toBeHidden(); // this info is hidden from public view
  await expect(page.getByLabel('SciX Public Library')).toBeVisible();
  await expect(page.getByTestId('lib-title')).toHaveText('001');
  await expect(page.getByTestId('lib-desc')).toHaveText('001');

  const metadata = page.getByTestId('lib-meta').locator('tbody td');
  await expect(metadata.nth(0)).toHaveText('Found 10 of 10');
  await expect(metadata.nth(1)).toHaveText('4/15/2019, 7:03:15 PM');
  await expect(metadata.nth(2)).toHaveText('4/1/2021, 3:11:10 PM');

  await expect(page.getByLabel('Results').getByRole('article')).toHaveCount(10);
});
