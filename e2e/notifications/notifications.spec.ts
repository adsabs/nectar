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

test('Add arxiv notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });

  // open create arxiv
  await page.getByTestId('create-noti-btn').click();
  await page.getByTestId('new-arxiv-btn').click();
  const form = page.getByTestId('create-arxiv-modal');
  await expect(form).toBeVisible();

  // enter keyword
  await form.locator('input').first().fill('star');
  await expect(form.locator('button').getByText('submit')).toBeDisabled();

  // select category, and all its childrens should be selected
  await form.getByLabel('expand Astrophysics').click();
  await form.locator('label').getByText('Astrophysics', { exact: true }).click();
  await expect(form.locator('input[value="astro-ph"]')).toBeChecked();
  await expect(form.locator('input[value="astro-ph.CO"]')).toBeChecked();
  await expect(form.locator('input[value="astro-ph.EP"]')).toBeChecked();
  await expect(form.locator('input[value="astro-ph.GA"]')).toBeChecked();
  await expect(form.locator('input[value="astro-ph.HE"]')).toBeChecked();
  await expect(form.locator('input[value="astro-ph.IM"]')).toBeChecked();
  await expect(form.locator('input[value="astro-ph.SR"]')).toBeChecked();

  // submit
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-arxiv-modal')).toBeHidden();

  // table should have new row
  const rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(6)).toContainText('7added examplearxivdaily');
});

test('Add citations notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });

  // open create
  await page.getByTestId('create-noti-btn').click();
  await page.getByTestId('new-citations-btn').click();
  const form = page.getByTestId('create-citations-modal');
  await expect(form).toBeVisible();
  await expect(form.locator('button').getByText('submit')).toBeDisabled();

  // enter authors
  await expect(form.getByLabel('add author')).toBeDisabled();
  await form.getByTestId('new-author-input').fill('Smith, Jane');
  await form.getByLabel('add author').click();
  await form.getByTestId('new-author-input').fill('1111-2222-3333-4444');
  await form.getByLabel('add author').click();

  // confirm authors entered
  let rows = form.getByTestId('authors-list-table').locator('tbody > tr');
  await expect(rows).toHaveCount(3); // including the new input row
  await expect(rows.nth(0)).toContainText('Smith, JaneAuthor');
  await expect(rows.nth(1)).toContainText('1111-2222-3333-4444Orcid');

  // submit
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-citations-modal')).toBeHidden();

  // table should have new row
  rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(6)).toContainText('7added examplecitationsweekly');
});

test('Add authors notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });
  await page.getByTestId('create-noti-btn').click();
  await page.getByTestId('new-authors-btn').click();
  const form = page.getByTestId('create-citations-modal'); // citations and authors use the same form
  await expect(form).toBeVisible();
  await expect(form.locator('button').getByText('submit')).toBeDisabled();

  // enter authors
  await expect(form.getByLabel('add author')).toBeDisabled();
  await form.getByTestId('new-author-input').fill('Smith, Jane');
  await form.getByLabel('add author').click();
  await form.getByTestId('new-author-input').fill('1111-2222-3333-4444');
  await form.getByLabel('add author').click();

  // confirm authors entered
  let rows = form.getByTestId('authors-list-table').locator('tbody > tr');
  await expect(rows).toHaveCount(3); // including the new input row
  await expect(rows.nth(0)).toContainText('Smith, JaneAuthor');
  await expect(rows.nth(1)).toContainText('1111-2222-3333-4444Orcid');

  // submit
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-citations-modal')).toBeHidden();

  // table should have new row
  rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(6)).toContainText('7added exampleauthorsweekly');
});

test('Add keyword notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });
  await page.getByTestId('create-noti-btn').click();
  await page.getByTestId('new-keyword-btn').click();
  const form = page.getByTestId('create-keyword-modal');
  await expect(form).toBeVisible();
  await expect(form.locator('button').getByText('submit')).toBeDisabled();

  // enter keyword
  await form.getByTestId('keyword-input').fill('star or planet');

  // submit
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-keyword-modal')).toBeHidden();

  // table should have new row
  const rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(6)).toContainText('7added examplekeywordweekly');
});

test('Add query notification', async ({ page }) => {
  // search page
  await page.goto('/search?q=Smith%2C+Jane&sort=score+desc&sort=date+desc&p=1', { timeout: 60000 });

  // click create query notification
  await page.getByLabel('Create email notification of this query').click();
  const form = page.getByTestId('create-query-modal');
  await expect(form).toBeVisible();
  await expect(form.locator('button').getByText('submit')).toBeDisabled();

  await form.getByTestId('create-query-name').fill('By Smith, Jane');
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-query-modal')).toBeHidden({ timeout: 5000 });

  // go to notifications
  await page.getByText('Account').click();
  await page.getByText('Email Notifications').click();
  await page.waitForURL('**/user/notifications**');
  expect(page.url()).toContain('/user/notifications');
  const rows = page.getByTestId('notifications-table').locator('tbody > tr');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(6)).toContainText('7By Smith, Janequerydaily');
});
