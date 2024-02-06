import { expect, test } from '@playwright/test';

test.describe.configure({
  mode: 'parallel',
});

test('Libraries show up in the table', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });
  const rows = page.getByTestId('libraries-table').locator('tbody > tr');
  await expect(rows).toHaveCount(10);
  await expect(page.getByTestId('pagination-string')).toHaveText('Showing 1 to 10 of 11 results');

  // go to next page
  await page.getByLabel('go to next page').click();
  await expect(page.getByTestId('libraries-table').locator('tbody > tr')).toHaveCount(1);
  await expect(page.getByTestId('pagination-string')).toHaveText('Showing 11 to 11 of 11 results');

  // show 50 per page
  await page.getByTestId('page-size-selector').selectOption('50');
  await expect(page.getByTestId('libraries-table').locator('tbody > tr')).toHaveCount(11);
  await expect(page.getByTestId('pagination-string')).toHaveText('Showing 1 to 11 of 11 results');
});

test('Sort libraries table', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });
  await expect(page.locator('tbody > tr').nth(0).locator('td').nth(3)).toContainText('001');

  // reverse sort order date
  await page.locator('thead > tr').nth(0).locator('th').nth(7).click();
  await expect(page.locator('tbody > tr').nth(0).locator('td').nth(3)).toContainText('11');

  // sort by name
  await page.locator('thead > tr').nth(0).locator('th').nth(3).click();
  await expect(page.locator('tbody > tr').nth(0).locator('td').nth(3)).toContainText('001');

  // reverse sort by name
  await page.locator('thead > tr').nth(0).locator('th').nth(3).click();
  await expect(page.locator('tbody > tr').nth(0).locator('td').nth(3)).toContainText('test6');
});

test('Add new library', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  await page.getByTestId('add-new-lib-btn').click();
  await expect(page.getByTestId('add-new-lib-modal')).toBeVisible();

  await page.getByTestId('cancel-add-lib').click();
  await expect(page.getByTestId('add-new-lib-modal')).toBeHidden();

  await page.getByTestId('add-new-lib-btn').click();
  await expect(page.getByTestId('add-new-lib-modal')).toBeVisible();
  await page.getByTestId('new-library-name').fill('A new text library');
  await page.getByTestId('new-library-desc').fill('A new library description');
  await page.locator("button[type='submit']").click();
  await expect(page.getByTestId('add-new-lib-modal')).toBeHidden();
  await expect(page.getByTestId('pagination-string')).toHaveText('Showing 1 to 10 of 12 results');

  await page.getByTestId('page-size-selector').selectOption('50');
  await expect(page.getByTestId('libraries-table').locator('tbody > tr')).toHaveCount(12);
});

test('Library operations - union', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  await page.getByTestId('lib-operation-btn').click();
  await expect(page.getByTestId('lib-operation-modal')).toBeVisible();

  await page.getByTestId('cancel-lib-operation').click();
  await expect(page.getByTestId('lib-operation-modal')).toBeHidden();

  await page.getByTestId('lib-operation-btn').click();
  await expect(page.getByTestId('lib-operation-modal')).toBeVisible();
  await page.getByTestId('lib-operation-modal').getByTestId('library-selector').click();
  await page.getByTestId('lib-operation-modal').locator('tbody > tr').nth(0).click();
  await page.getByTestId('lib-operation-modal').getByTestId('library-selector').click();
  await page.getByTestId('lib-operation-modal').locator('tbody > tr').nth(1).click();

  await page.getByTestId('lib-operation-modal').getByTestId('new-lib-name').fill('A new text library');
  await page.getByTestId('lib-operation-modal').getByTestId('new-lib-desc').fill('A new library description');
  await page.getByTestId('lib-operation-modal').locator("button[type='submit']").click();

  await expect(page.getByTestId('lib-operation-modal')).toBeHidden();
  await expect(page.getByTestId('pagination-string')).toHaveText('Showing 1 to 10 of 12 results');
});

test('Library operations - copy', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  await page.getByTestId('lib-operation-btn').click();
  await expect(page.getByTestId('lib-operation-modal')).toBeVisible();

  await page.getByTestId('radio-copy').click();

  await page.getByTestId('lib-operation-modal').getByTestId('source-selector').getByTestId('library-selector').click();
  await page.getByTestId('lib-operation-modal').locator('tbody > tr').nth(0).click();
  await page.getByTestId('lib-operation-modal').getByTestId('target-selector').getByTestId('library-selector').click();
  await page.getByTestId('lib-operation-modal').locator('tbody > tr').nth(1).click();

  await page.getByTestId('lib-operation-modal').locator("button[type='submit']").click();

  await expect(page.getByTestId('lib-operation-modal')).toBeHidden();
  await expect(page.getByTestId('libraries-table').locator('tbody > tr').nth(1).locator('td').nth(4)).toHaveText('10');
});

test('Library operations - empty', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  await page.getByTestId('lib-operation-btn').click();
  await expect(page.getByTestId('lib-operation-modal')).toBeVisible();

  await page.getByTestId('radio-empty').click();

  await page.getByTestId('lib-operation-modal').getByTestId('source-selector').getByTestId('library-selector').click();
  await page.getByTestId('lib-operation-modal').locator('tbody > tr').nth(0).click();

  await page.getByTestId('lib-operation-modal').locator("button[type='submit']").click();

  await expect(page.getByTestId('lib-operation-modal')).toBeHidden();
  await expect(page.getByTestId('libraries-table').locator('tbody > tr').nth(0).locator('td').nth(4)).toHaveText('0');
});

test('Delete libraries', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  // no permission to delete
  await page.locator('tbody > tr').nth(0).getByTestId('library-action-menu').click();
  await expect(page.locator('tbody > tr').nth(0).getByRole('menuitem').nth(1)).toBeDisabled();

  // has permission to delete
  await page.locator('tbody > tr').nth(9).getByTestId('library-action-menu').click();
  await expect(page.locator('tbody > tr').nth(9).getByRole('menuitem').nth(1)).toBeEnabled();
  await page.locator('tbody > tr').nth(9).getByRole('menuitem').nth(1).click();
  await page.getByTestId('confirm-del-lib-btn').click();

  await expect(page.getByTestId('libraries-table').locator('tbody > tr')).toHaveCount(10);
  await expect(page.getByTestId('pagination-string')).toHaveText('Showing 1 to 10 of 10 results');
});

test('Action menu -> settings go to library settings page', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  await page.locator('tbody > tr').nth(0).getByTestId('library-action-menu').click();
  await expect(page.locator('tbody > tr').nth(0).getByRole('menuitem').nth(0)).toBeEditable();

  await page.locator('tbody > tr').nth(9).getByTestId('library-action-menu').click();
  await expect(page.locator('tbody > tr').nth(9).getByRole('menuitem').nth(0)).toBeEnabled();
  await page.locator('tbody > tr').nth(9).getByRole('menuitem').nth(0).click();

  await page.waitForURL('**/settings?**');
  expect(page.url()).toContain('/settings?from=landing');
});

test('Click on library goes to individual library page', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  await page.locator('tbody > tr').nth(0).click();

  await page.waitForURL('**/libraries/001');
  expect(page.url()).toContain('/libraries/001');
});
