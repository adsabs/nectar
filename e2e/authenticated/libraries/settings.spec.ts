import { expect, test } from '@playwright/test';

test.describe.configure({
  mode: 'parallel',
});

test.skip('Library settings back button goes to the landing page', async ({ page }) => {
  await page.goto('/user/libraries', { timeout: 60000 });

  await page.locator('tbody > tr').nth(0).getByTestId('library-action-menu').click();
  await expect(page.locator('tbody > tr').nth(0).getByRole('menuitem').nth(0)).toBeEditable();
  await page.locator('tbody > tr').nth(0).getByRole('menuitem').nth(0).click();

  await page.waitForURL('**/user/libraries/001/settings?**');
  expect(page.url()).toContain('/user/libraries/001/settings?from=landing');

  // back button goes back to landing
  await page.getByTestId('settings-back-btn').click();
  await page.waitForURL(/^.*\/user\/libraries$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries$/);
});

test.skip('Library settings back button goes to the library page', async ({ page }) => {
  // enter from library entity
  await page.goto('/user/libraries/001', { timeout: 60000 });
  await page.getByTestId('settings-btn').click();
  await page.waitForURL(/^.*\/user\/libraries\/001\/settings$/);
  expect(page.url()).toContain('/user/libraries/001/settings');

  // back button goes back to library
  await page.getByTestId('settings-back-btn').click();
  await page.waitForURL(/^.*\/user\/libraries\/001$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries\/001$/);
});

test.skip('Library settings has correct information for owner', async ({ page }) => {
  await page.goto('/user/libraries/004/settings', { timeout: 60000 });

  await expect(page.getByTestId('library-name-input')).toBeEditable({ editable: true });
  await expect(page.getByTestId('library-name-input')).toHaveValue('test1');
  await expect(page.getByTestId('library-desc-input')).toBeEditable({ editable: true });
  await expect(page.getByTestId('library-desc-input')).toHaveValue('My ADS library');
  await expect(page.getByTestId('library-public-switch').locator('input[type="checkbox"]')).toBeEditable({
    editable: true,
  });
  expect(page.getByTestId('library-public-switch').getByLabel('is public')).toBeDefined();
  await expect(page.locator('button').getByText('Save')).toBeDisabled();

  await expect(page.getByText('Transfer Ownership')).toBeVisible();

  await expect(page.locator('.metadata').nth(0)).toContainText('owner');
  await expect(page.locator('.metadata').nth(1)).toContainText('ads.user.1');
  await expect(page.locator('.metadata').nth(2)).toContainText('2/23/2022, 9:25:13 PM');
  await expect(page.locator('.metadata').nth(3)).toContainText('3/31/2022, 8:27:22 PM');

  await expect(page.getByText('This library has no collaborators')).toHaveCount(1);
  await expect(page.getByTestId('collab-table')).toBeVisible();

  // delete is allowed
  await expect(page.getByText('Delete Library')).toBeVisible();
});

test.skip('Library settings has correct information for admin', async ({ page }) => {
  await page.goto('/user/libraries/001/settings', { timeout: 60000 });

  await expect(page.getByTestId('library-name-input')).toBeEnabled();
  await expect(page.getByTestId('library-name-input')).toHaveValue('001');
  await expect(page.getByTestId('library-desc-input')).toBeEnabled();
  await expect(page.getByTestId('library-desc-input')).toHaveValue('001');
  await expect(page.getByTestId('library-public-switch').locator('input[type="checkbox"]')).toBeEnabled();
  expect(page.getByTestId('library-public-switch').getByLabel('is public')).toBeDefined();
  await expect(page.locator('button').getByText('Save')).toBeDisabled();

  await expect(page.getByText('Transfer Ownership')).toBeHidden();

  await expect(page.locator('.metadata').nth(0)).toContainText('admin');
  await expect(page.locator('.metadata').nth(1)).toContainText('ads.user.20');
  await expect(page.locator('.metadata').nth(2)).toContainText('4/15/2019, 7:03:15 PM');
  await expect(page.locator('.metadata').nth(3)).toContainText('4/1/2021, 3:11:10 PM');

  await expect(page.getByText('Transfer Ownership')).toBeHidden();

  await expect(page.getByText('This library has 1 collaborators')).toHaveCount(1);
  await expect(page.getByTestId('collaborator-row')).toHaveCount(1);
  await expect(page.getByTestId('collaborator-row').nth(0).locator('td').nth(1)).toContainText('ads.user.1');
  await expect(page.getByTestId('collaborator-row').nth(0).locator('td').nth(2).locator('input').nth(1)).toHaveValue(
    'read',
  );
  await expect(page.getByTestId('collab-table')).toBeVisible();
  await expect(page.getByTestId('collab-table').locator('tbody tr')).toHaveCount(2);

  // delete is not allowed
  await expect(page.getByText('Delete Library')).toBeHidden();
});

test.skip('Library with admin permission can edit but cannot delete', async ({ page }) => {
  await page.goto('/user/libraries/001/settings', { timeout: 60000 });

  await expect(page.getByText('Delete Library')).toBeHidden();

  // modify
  await page.getByTestId('library-name-input').fill('100');
  await page.getByTestId('library-desc-input').fill('001 updated');
  await page.getByTestId('library-public-switch').click();
  await expect(page.locator('button').getByText('Save')).toBeEnabled();
  await page.locator('button').getByText('Save').click();
  await expect(page.locator('button').getByText('Save')).toBeDisabled();

  // go back to landing page
  await page.getByTestId('settings-back-btn').click();
  await page.waitForURL(/^.*\/user\/libraries\/001$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries\/001$/);

  // should have updated metadata
  await expect(page.getByLabel('public')).toBeVisible();
  await expect(page.getByTestId('lib-title')).toHaveText('100');
  await expect(page.getByTestId('lib-desc')).toHaveText('001 updated');

  // go back to landing page
  await page.getByTestId('lib-back-btn').click();
  await page.waitForURL(/^.*\/user\/libraries$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries$/);

  // row 1 should have updated information
  const row = page.getByTestId('libraries-table').locator('tbody > tr').nth(0).locator('td');

  // name
  await expect(row.nth(3).locator('p').nth(0)).toContainText('100');

  // desc
  await expect(row.nth(3).locator('p').nth(1)).toContainText('001 updated');

  await expect(row.nth(1).getByLabel('public')).toBeVisible();
});

test.skip('User with write permission cannot edit settings', async ({ page }) => {
  await page.goto('/user/libraries/002/settings', { timeout: 60000 });

  await expect(page.getByTestId('library-name-input')).toBeEditable({ editable: false });
  await expect(page.getByTestId('library-desc-input')).toBeEditable({ editable: false });
  await expect(page.getByTestId('library-public-switch').locator('input[type="checkbox"]')).toBeEditable({
    editable: false,
  });
  await expect(page.locator('button').getByText('Save')).toBeHidden();

  await expect(page.getByText('Transfer Ownership')).toBeHidden();

  await expect(page.getByTestId('collab-table')).toBeHidden();

  await expect(page.getByText('Delete Library')).toBeHidden();
});

test.skip('User with read permission cannot edit settings', async ({ page }) => {
  await page.goto('/user/libraries/003/settings', { timeout: 60000 });

  await expect(page.getByTestId('library-name-input')).toBeEditable({ editable: false });
  await expect(page.getByTestId('library-desc-input')).toBeEditable({ editable: false });
  await expect(page.getByTestId('library-public-switch').locator('input[type="checkbox"]')).toBeEditable({
    editable: false,
  });
  await expect(page.locator('button').getByText('Save')).toBeHidden();

  await expect(page.getByText('Transfer Ownership')).toBeHidden();

  await expect(page.getByTestId('collab-table')).toBeHidden();

  await expect(page.getByText('Delete Library')).toBeHidden();
});

test.skip('Library owner can edit library metadata', async ({ page }) => {
  await page.goto('/user/libraries/004/settings', { timeout: 60000 });

  // modify
  await page.getByTestId('library-name-input').fill('400');
  await page.getByTestId('library-desc-input').fill('004 updated');
  await page.getByTestId('library-public-switch').click();
  await expect(page.locator('button').getByText('Save')).toBeEnabled();
  await page.locator('button').getByText('Save').click();
  await expect(page.locator('button').getByText('Save')).toBeDisabled();

  // go back to landing page
  await page.getByTestId('settings-back-btn').click();
  await page.waitForURL(/^.*\/user\/libraries\/004$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries\/004$/);

  // should have updated metadata
  await expect(page.getByLabel('public')).toBeVisible();
  await expect(page.getByTestId('lib-title')).toHaveText('400');
  await expect(page.getByTestId('lib-desc')).toHaveText('004 updated');

  // go back to landing page
  await page.getByTestId('lib-back-btn').click();
  await page.waitForURL(/^.*\/user\/libraries$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries$/);

  // row 1 should have updated information
  const row = page.getByTestId('libraries-table').locator('tbody > tr').nth(3).locator('td');

  // name
  await expect(row.nth(3).locator('p').nth(0)).toContainText('400');

  // desc
  await expect(row.nth(3).locator('p').nth(1)).toContainText('004 updated');
});

test.skip('Library owner can delete library', async ({ page }) => {
  await page.goto('/user/libraries/004/settings', { timeout: 60000 });
  await page.getByText('Delete Library').click();
  await page.getByTestId('confirm-del-lib-btn').click();
  await page.waitForURL(/^.*\/user\/libraries$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries$/);
  await expect(page.getByTestId('libraries-table').locator('tbody > tr')).toHaveCount(10);
  await expect(page.getByTestId('pagination-string')).toHaveText('Showing 1 to 10 of 10 results');
});

test.skip('Owner can edit collaborators', async ({ page }) => {
  await page.goto('/user/libraries/004/settings', { timeout: 60000 });

  // add user
  expect(page.getByTestId('new-collaborator-row').locator('td').nth(1).locator('input').fill('ads.user.100@mail.com'));
  await page.getByTestId('add-collaborator-btn').click();
  await expect(page.getByTestId('collab-table').locator('tbody tr')).toHaveCount(2);
  await expect(page.getByTestId('collab-table').locator('tbody tr').nth(0).locator('td').nth(1)).toContainText(
    'ads.user.100',
  );
  await expect(page.getByTestId('collab-table').locator('tbody tr').nth(0).locator('td').nth(2)).toContainText('read');

  // edit permission
  await page.getByTestId('collab-table').locator('tbody tr').nth(0).locator('td').nth(2).locator('div').nth(0).click();
  await page.locator('[id^="react-select-permission-type-"]').locator('[id$="-option-0"]').click();
  await expect(page.getByTestId('collab-table').locator('tbody tr').nth(0).locator('td').nth(2)).toContainText('admin');

  // remove user
  await page.getByTestId('collab-table').locator('tbody tr').nth(0).getByLabel('delete collaborator').click();
  await expect(page.getByTestId('collab-table').locator('tbody tr')).toHaveCount(2);
});

test.skip('Admin can edit collaborators', async ({ page }) => {
  await page.goto('/user/libraries/001/settings', { timeout: 60000 });

  // add user
  expect(page.getByTestId('new-collaborator-row').locator('td').nth(1).locator('input').fill('ads.user.100@mail.com'));
  await page.getByTestId('add-collaborator-btn').click();
  await expect(page.getByTestId('collab-table').locator('tbody tr')).toHaveCount(3);
  await expect(page.getByTestId('collab-table').locator('tbody tr').nth(1).locator('td').nth(1)).toContainText(
    'ads.user.100',
  );
  await expect(page.getByTestId('collab-table').locator('tbody tr').nth(1).locator('td').nth(2)).toContainText('read');

  // edit permission
  await page.getByTestId('collab-table').locator('tbody tr').nth(1).locator('td').nth(2).locator('div').nth(0).click();
  await page.locator('[id^="react-select-permission-type-"]').locator('[id$="-option-0"]').click();
  await expect(page.getByTestId('collab-table').locator('tbody tr').nth(1).locator('td').nth(2)).toContainText('admin');

  // remove user
  await page.getByTestId('collab-table').locator('tbody tr').nth(1).getByLabel('delete collaborator').click();
  await expect(page.getByTestId('collab-table').locator('tbody tr')).toHaveCount(2);
});

test.skip('User with write permission canot edit collaborators', async ({ page }) => {
  await page.goto('/user/libraries/002/settings', { timeout: 60000 });

  await expect(page.getByTestId('new-collaborator-row')).toBeHidden();
});

test.skip('User with read permission canot edit collaborators', async ({ page }) => {
  await page.goto('/user/libraries/003/settings', { timeout: 60000 });

  await expect(page.getByTestId('new-collaborator-row')).toBeHidden();
});

test.skip('Owner can transfer library', async ({ page }) => {
  await page.goto('/user/libraries/004/settings', { timeout: 60000 });

  await page.getByText('Transfer Ownership').click();
  await page.getByTestId('transfer-owner-email-input').fill('ads.user.100@mail.com');
  await page.getByTestId('transfer-submit-btn').click();

  // wait for redirect to landing page
  await page.waitForURL(/^.*\/user\/libraries$/);
  expect(page.url()).toMatch(/^.*\/user\/libraries$/);

  // shows new owner
  await expect(page.getByTestId('libraries-table').locator('tbody > tr').nth(3).locator('td').nth(5)).toContainText(
    'ads.user.100',
  );
});
