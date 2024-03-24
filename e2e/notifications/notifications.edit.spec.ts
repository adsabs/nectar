import { expect, test } from '@playwright/test';

test.describe.configure({
  mode: 'parallel',
});

test('Edit arxiv notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });

  // edit
  await page.getByTestId('action-btn').nth(1).click();
  await expect(page.locator('button[role="menuitem"]').getByText('Edit').nth(0)).toBeVisible();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(0).click({ force: true }); // first row is query which has no 'edit', so index is shifted down by 1

  // modal visible
  let form = page.getByTestId('create-arxiv-modal');
  await expect(form).toBeVisible();

  // change name
  await form.locator('input').first().fill('star arxiv');

  // change keyword
  await form.locator('input').nth(1).fill('star');

  // select category, and all its childrens should be selected
  await form.getByLabel('expand Astrophysics').click();
  await form.locator('label').getByText('Astrophysics', { exact: true }).click(); // uncheck
  await form.locator('label').getByText('General Relativity and Quantum Cosmology', { exact: true }).click(); // check

  await expect(form.locator('input[value="astro-ph"]')).toBeChecked({ checked: false });
  await expect(form.locator('input[value="gr-qc"]')).toBeChecked();

  // submit
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-arxiv-modal')).toBeHidden();

  // check name updated
  await expect(page.getByTestId('notifications-table').locator('tbody > tr').nth(1)).toContainText(
    '2star arxivarxivdaily',
  );

  // open again to check updated
  await page.getByTestId('action-btn').nth(1).click();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(0).click({ force: true });
  form = page.getByTestId('create-arxiv-modal');
  await expect(form).toBeVisible();
  await expect(form.locator('input').first()).toHaveValue('star arxiv');
  await expect(form.locator('input[value="astro-ph"]')).toBeChecked({ checked: false });
  await expect(form.locator('input[value="gr-qc"]')).toBeChecked();
});

test('Edit citations notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });

  // edit
  await page.getByTestId('action-btn').nth(3).click();
  await expect(page.locator('button[role="menuitem"]').getByText('Edit').nth(2)).toBeVisible();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(2).click({ force: true }); // first row is query which has no 'edit', so index is shifted down by 1
  let form = page.getByTestId('create-citations-modal');
  await expect(form).toBeVisible();

  // change name
  await form.locator('input').first().fill('smith');

  // add author
  await expect(form.getByLabel('add author')).toBeDisabled();
  await form.getByTestId('new-author-input').fill('Smith, Jane');
  await form.getByLabel('add author').click();

  // delete author
  await form.getByLabel('delete').first().click();

  // confirm authors entered
  let rows = form.getByTestId('authors-list-table').locator('tbody > tr');
  await expect(rows).toHaveCount(3); // including the new input row
  await expect(rows.nth(0)).toContainText('Smith, JohnAuthor');
  await expect(rows.nth(1)).toContainText('Smith, JaneAuthor');

  // submit
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-citations-modal')).toBeHidden();

  // check name updated
  await expect(page.getByTestId('notifications-table').locator('tbody > tr').nth(3)).toContainText(
    '4smithcitationsweekly',
  );

  // open again to check updated
  await page.getByTestId('action-btn').nth(3).click();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(2).click({ force: true });
  form = page.getByTestId('create-citations-modal');
  await expect(form).toBeVisible();
  await expect(form.locator('input').first()).toHaveValue('smith');
  rows = form.getByTestId('authors-list-table').locator('tbody > tr');
  await expect(rows).toHaveCount(3); // including the new input row
  await expect(rows.nth(0)).toContainText('Smith, JohnAuthor');
  await expect(rows.nth(1)).toContainText('Smith, JaneAuthor');
});

test('Edit authors notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });

  // edit
  await page.getByTestId('action-btn').nth(4).click();
  await expect(page.locator('button[role="menuitem"]').getByText('Edit').nth(3)).toBeVisible();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(3).click({ force: true }); // first row is query which has no 'edit', so index is shifted down by 1
  let form = page.getByTestId('create-citations-modal'); // citations and authors use the same form
  await expect(form).toBeVisible();

  // change name
  await form.locator('input').first().fill('jane');

  // add author
  await expect(form.getByLabel('add author')).toBeDisabled();
  await form.getByTestId('new-author-input').fill('Smith, Jane');
  await form.getByLabel('add author').click();

  // delete author
  await form.getByLabel('delete').first().click();

  // confirm authors entered
  let rows = form.getByTestId('authors-list-table').locator('tbody > tr');
  await expect(rows).toHaveCount(3); // including the new input row
  await expect(rows.nth(0)).toContainText('Doe, JaneAuthor');
  await expect(rows.nth(1)).toContainText('Smith, JaneAuthor');

  // submit
  await expect(form.locator('button').getByText('submit')).toBeEnabled();
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-citations-modal')).toBeHidden();

  // check name updated
  await expect(page.getByTestId('notifications-table').locator('tbody > tr').nth(4)).toContainText(
    '5janeauthorsweekly',
  );

  // open again to check updated
  await page.getByTestId('action-btn').nth(4).click();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(3).click({ force: true });
  form = page.getByTestId('create-citations-modal');
  await expect(form).toBeVisible();
  await expect(form.locator('input').first()).toHaveValue('jane');
  rows = form.getByTestId('authors-list-table').locator('tbody > tr');
  await expect(rows).toHaveCount(3); // including the new input row
  await expect(rows.nth(0)).toContainText('Doe, JaneAuthor');
  await expect(rows.nth(1)).toContainText('Smith, JaneAuthor');
});

test('Edit keyword notification', async ({ page }) => {
  await page.goto('/user/notifications', { timeout: 60000 });

  // edit
  await page.getByTestId('action-btn').nth(5).click();
  await expect(page.locator('button[role="menuitem"]').getByText('Edit').nth(4)).toBeVisible();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(4).click({ force: true }); // first row is query which has no 'edit', so index is shifted down by 1
  let form = page.getByTestId('create-keyword-modal');
  await expect(form).toBeVisible();

  // change name
  await form.locator('input').first().fill('black hole');

  // update keyword
  await form.getByTestId('keyword-input').fill('black hole');

  // submit
  await form.locator('button').getByText('submit').click();
  await expect(page.getByTestId('create-keyword-modal')).toBeHidden();

  // check name updated
  await expect(page.getByTestId('notifications-table').locator('tbody > tr').nth(5)).toContainText(
    '6black holekeywordweekly',
  );

  // table should have new row
  await page.getByTestId('action-btn').nth(5).click();
  await page.locator('button[role="menuitem"]').getByText('Edit').nth(4).click({ force: true });
  form = page.getByTestId('create-keyword-modal');
  await expect(form).toBeVisible();
  await expect(form.locator('input').first()).toHaveValue('black hole');
  await expect(form.getByTestId('keyword-input')).toHaveValue('black hole');
});
