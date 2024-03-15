import { expect, test } from '@playwright/test';

test.describe.configure({
  mode: 'parallel',
});

test('Notifications show up in the table', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });
  const rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(6);
  await expect(rows.nth(0)).toContainText('1query examplequerydaily');
  await expect(rows.nth(1)).toContainText('2arxiv without keywordarxivdaily');
  await expect(rows.nth(2)).toContainText('3arxiv with keywordarxivdaily');
  await expect(rows.nth(3)).toContainText('4citations examplecitationsweekly');
  await expect(rows.nth(4)).toContainText('5authors exampleauthorsweekly');
  await expect(rows.nth(5)).toContainText('6keyword examplekeywordweekly');
});

test('Delete notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });
  await page.getByTestId('action-btn').nth(0).click();
  await expect(page.locator('button[role="menuitem"]').getByText('Delete Notification').nth(0)).toBeVisible();
  await page.locator('button[role="menuitem"]').getByText('Delete').nth(0).click({ force: true });
  await page.getByTestId('confirm-del-lib-btn').click();

  const rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(5);
  await expect(rows.nth(0)).toContainText('1arxiv without keywordarxivdaily');
  await expect(rows.nth(1)).toContainText('2arxiv with keywordarxivdaily');
  await expect(rows.nth(2)).toContainText('3citations examplecitationsweekly');
  await expect(rows.nth(3)).toContainText('4authors exampleauthorsweekly');
  await expect(rows.nth(4)).toContainText('5keyword examplekeywordweekly');
});

test('Filter notifications', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });

  await page.getByTestId('filter-notifications').fill('daily');
  let rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(3);

  // clear
  await page.getByLabel('clear').click();
  rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(6);
});

test('Search menus are correct', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });
  await page.getByTestId('action-btn').nth(0).click(); // query notification
  let search = page.getByTestId('action-menu').nth(0).locator('button[role="menuitem"]').getByText('Search');
  await expect(search).toBeVisible();
  await page.getByTestId('action-btn').nth(0).click(); // close

  await page.getByTestId('action-btn').nth(1).click(); // arxiv no keyword notification
  search = page.getByTestId('action-menu').nth(1).locator('button[role="menuitem"]').getByText('Search');
  await expect(search).toBeVisible();
  await page.getByTestId('action-btn').nth(1).click(); // close

  await page.getByTestId('action-btn').nth(2).click(); // arxiv with keyword notification
  search = page
    .getByTestId('action-menu')
    .nth(2)
    .locator('button[role="menuitem"]')
    .getByText('Keyword Matches - Recent Papers');
  await expect(search).toBeVisible();
  search = page
    .getByTestId('action-menu')
    .nth(2)
    .locator('button[role="menuitem"]')
    .getByText('Other Recent Papers in Selected Categories');
  await expect(search).toBeVisible();
  await page.getByTestId('action-btn').nth(2).click(); // close

  await page.getByTestId('action-btn').nth(3).click(); // citation notification
  search = page.getByTestId('action-menu').nth(3).locator('button[role="menuitem"]').getByText('Search');
  await expect(search).toBeVisible();
  await page.getByTestId('action-btn').nth(3).click(); // close

  await page.getByTestId('action-btn').nth(4).click(); // author notification
  search = page.getByTestId('action-menu').nth(4).locator('button[role="menuitem"]').getByText('Search');
  await expect(search).toBeVisible();
  await page.getByTestId('action-btn').nth(4).click(); // close

  await page.getByTestId('action-btn').nth(5).click(); // keyword notification
  search = page.getByTestId('action-menu').nth(5).locator('button[role="menuitem"]').getByText('Recent Papers');
  await expect(search).toBeVisible();
  search = page.getByTestId('action-menu').nth(5).locator('button[role="menuitem"]').getByText('Most Popular');
  await expect(search).toBeVisible();
  search = page.getByTestId('action-menu').nth(5).locator('button[role="menuitem"]').getByText('Most Cited');
  await expect(search).toBeVisible();
  await page.getByTestId('action-btn').nth(5).click(); // close
});

test('Action: search', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });
  await page.getByTestId('action-btn').nth(0).click(); // a query notification
  const search = page.getByTestId('action-menu').nth(0).locator('button[role="menuitem"]').getByText('Search');
  await expect(search).toBeVisible();
  await search.click({ force: true });

  await page.waitForURL('**/search?**');
  expect(page.url()).toContain('/search?q=star&sort=date+desc&p=1');
});

test('Enable disable notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });
  await page.getByTestId('action-btn').nth(0).click();
  let btn = page.getByTestId('action-menu').nth(0).locator('button[role="menuitem"]').getByText('Enable Notification?');
  await expect(btn).toBeVisible();
  await expect(page.getByTestId('action-menu').nth(0).locator('input[type="checkbox"]')).toBeChecked();

  // disable
  await btn.click({ force: true });
  await page.getByTestId('action-btn').nth(0).click();
  btn = page.getByTestId('action-menu').nth(0).locator('button[role="menuitem"]').getByText('Enable Notification?');
  await expect(btn).toBeVisible();
  await expect(page.getByTestId('action-menu').nth(0).locator('input[type="checkbox"]')).toBeChecked({
    checked: false,
  });
});
