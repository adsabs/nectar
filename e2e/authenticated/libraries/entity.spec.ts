import { expect, test } from '@playwright/test';

test.describe.configure({
  mode: 'parallel',
});

test.fixme('Back button goes to landing page', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByTestId('lib-back-btn').click();
  await page.waitForURL('**/user/libraries');
  expect(page.url()).toMatch(/^.*\/user\/libraries$/);
});

test.fixme('Library metadata are correct', async ({ page }) => {
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

test.fixme('Click on view library as search results goes to search', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByText('View as Search Results').click();
  await page.waitForURL('**/search**');
  expect(page.url()).toMatch(/^.*\/search\?q=docs\(library%2F001\).*/);
});

test.fixme('Edit document annotations with admin permission', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  // initial state are correct
  await page.getByLabel('show abstract').first().click(); // expand abstract / annotation
  const annotationArea1 = page.getByTestId('annotation').first();
  await expect(annotationArea1.locator('textarea')).toBeHidden(); // not in editing mode
  await expect(annotationArea1).toHaveText('Notes for 00000'); // has correct annotation
  await annotationArea1.getByLabel('add/edit annotation').first().isEnabled(); // edit button enabled
  await expect(annotationArea1.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeHidden();

  // edit mode
  await annotationArea1.getByLabel('add/edit annotation').first().click(); // edit button click
  await expect(annotationArea1.locator('textarea')).toBeVisible(); // in edit mode
  await expect(annotationArea1.getByLabel('submit').first()).toBeDisabled();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeEnabled();

  // cancel works
  await annotationArea1.locator('textarea').fill('Updated notes for 00000');
  await expect(annotationArea1.getByLabel('submit').first()).toBeEnabled();
  await annotationArea1.getByLabel('cancel').first().click(); // click cancel
  await expect(annotationArea1.locator('textarea')).toBeHidden(); // not in editing mode
  await expect(annotationArea1).toHaveText('Notes for 00000');
  await expect(annotationArea1.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeHidden();

  // modify existing annotation and submit
  await annotationArea1.getByLabel('add/edit annotation').first().click(); // edit button click
  await annotationArea1.locator('textarea').fill('Updated notes for 00000');
  const responsePromise = page.waitForEvent('requestfinished');
  await annotationArea1.getByLabel('submit').first().click(); // submit
  await responsePromise;
  await expect(annotationArea1).toHaveText('Updated notes for 00000'); // has updated annotation
  await annotationArea1.getByLabel('add/edit annotation').first().isEnabled(); // edit button enabled
  await expect(annotationArea1.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeHidden();

  // create new annotation and submit
  await page.getByLabel('show abstract').nth(1).click(); // expand abstract / annotation
  const annotationArea2 = page.getByTestId('annotation').nth(1);
  await annotationArea2.getByLabel('add/edit annotation').first().click(); // edit button click
  await annotationArea2.locator('textarea').fill('Notes for 11111');
  const responsePromise2 = page.waitForEvent('requestfinished');
  await annotationArea2.getByLabel('submit').first().click(); // submit
  await responsePromise2;
  await expect(annotationArea2).toHaveText('Notes for 11111');
  await expect(annotationArea2.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea2.getByLabel('cancel').first()).toBeHidden();

  // delete annotation
  await annotationArea2.getByLabel('add/edit annotation').first().click(); // edit button click
  await annotationArea2.locator('textarea').fill('');
  const responsePromise3 = page.waitForEvent('requestfinished');
  await annotationArea2.getByLabel('submit').first().click(); // submit
  await responsePromise3;
  await expect(annotationArea2).toHaveText('No annotations. Click the edit icon to add one.');
  await expect(annotationArea2.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea2.getByLabel('cancel').first()).toBeHidden();
});

test.fixme('View document annotations with write permission', async ({ page }) => {
  await page.goto('/user/libraries/002', { timeout: 60000 });

  await page.getByLabel('show abstract').first().click(); // expand abstract / annotation
  const annotationArea1 = page.getByTestId('annotation').first();
  await expect(annotationArea1.locator('textarea')).toBeHidden(); // not in editing mode
  await expect(annotationArea1).toHaveText('Notes for 11111'); // has correct annotation
  await annotationArea1.getByLabel('add/edit annotation').first().isEnabled(); // edit button enabled
  await expect(annotationArea1.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeHidden();

  // edit mode
  await annotationArea1.getByLabel('add/edit annotation').first().click(); // edit button click
  await expect(annotationArea1.locator('textarea')).toBeVisible(); // in edit mode
  await expect(annotationArea1.getByLabel('submit').first()).toBeDisabled();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeEnabled();

  // cancel works
  await annotationArea1.locator('textarea').fill('Updated notes for 11111');
  await expect(annotationArea1.getByLabel('submit').first()).toBeEnabled();
  await annotationArea1.getByLabel('cancel').first().click(); // click cancel
  await expect(annotationArea1.locator('textarea')).toBeHidden(); // not in editing mode
  await expect(annotationArea1).toHaveText('Notes for 11111');
  await expect(annotationArea1.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeHidden();

  // // modify existing annotation and submit
  await annotationArea1.getByLabel('add/edit annotation').first().click(); // edit button click
  await annotationArea1.locator('textarea').fill('Updated notes for 11111');
  const responsePromise = page.waitForEvent('requestfinished');
  await annotationArea1.getByLabel('submit').first().click(); // submit
  await responsePromise;
  await expect(annotationArea1).toHaveText('Updated notes for 11111'); // has updated annotation
  await annotationArea1.getByLabel('add/edit annotation').first().isEnabled(); // edit button enabled
  await expect(annotationArea1.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeHidden();

  // create new annotation and submit
  await page.getByLabel('show abstract').nth(1).click(); // expand abstract / annotation
  const annotationArea2 = page.getByTestId('annotation').nth(1);
  await annotationArea2.getByLabel('add/edit annotation').first().click(); // edit button click
  await annotationArea2.locator('textarea').fill('Notes for 22222');
  const responsePromise2 = page.waitForEvent('requestfinished');
  await annotationArea2.getByLabel('submit').first().click(); // submit
  await responsePromise2;
  await expect(annotationArea2).toHaveText('Notes for 22222');
  await expect(annotationArea2.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea2.getByLabel('cancel').first()).toBeHidden();

  // delete annotation
  await annotationArea2.getByLabel('add/edit annotation').first().click(); // edit button click
  await annotationArea2.locator('textarea').fill('');
  const responsePromise3 = page.waitForEvent('requestfinished');
  await annotationArea2.getByLabel('submit').first().click(); // submit
  await responsePromise3;
  await expect(annotationArea2).toHaveText('No annotations. Click the edit icon to add one.');
  await expect(annotationArea2.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea2.getByLabel('cancel').first()).toBeHidden();
});

test.fixme('View document annotations with read permission', async ({ page }) => {
  await page.goto('/user/libraries/003', { timeout: 60000 });

  // can see annotation but cannot edit
  await page.getByLabel('show abstract').nth(0).click(); // expand abstract / annotation
  const annotationArea1 = page.getByTestId('annotation').first();
  await expect(annotationArea1.locator('textarea')).toBeHidden(); // not in editing mode
  await expect(annotationArea1).toHaveText('Notes for aaaaa'); // has correct annotation
  await expect(annotationArea1.getByLabel('add/edit annotation').first()).toBeHidden(); // edit button hidden
  await expect(annotationArea1.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea1.getByLabel('cancel').first()).toBeHidden();

  // no annotation message
  await page.getByLabel('show abstract').nth(1).click(); // expand abstract / annotation
  const annotationArea2 = page.getByTestId('annotation').nth(1);
  await expect(annotationArea2.locator('textarea')).toBeHidden(); // not in editing mode
  await expect(annotationArea2).toHaveText('No annotations. Collaborators with write permission can add annotations.'); // has no annotation
  await expect(annotationArea2.getByLabel('add/edit annotation').first()).toBeHidden(); // edit button hidden
  await expect(annotationArea2.getByLabel('submit').first()).toBeHidden();
  await expect(annotationArea2.getByLabel('cancel').first()).toBeHidden();
});

test.fixme('Delete selected docs from library', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByTestId('document-checkbox').nth(1).check();
  await page.getByTestId('document-checkbox').nth(2).check();

  await page.getByTestId('del-selected-btn').click();
  await expect(page.getByLabel('Results').getByRole('article')).toHaveCount(8);
});

test.fixme('Delete all docs from library', async ({ page }) => {
  await page.goto('/user/libraries/001', { timeout: 60000 });

  await page.getByTestId('select-all-checkbox').check();

  await page.getByTestId('del-selected-btn').click();
  await expect(page.getByLabel('Results').getByRole('article')).toHaveCount(0);
});

test.fixme('Public library view should have correct metadata', async ({ page }) => {
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

test.fixme('Public library should show abstract but not annotations', async ({ page }) => {
  await page.goto('/public-libraries/001', { timeout: 60000 });

  await page.getByLabel('show abstract').first().click(); // expand abstract / annotation
  await expect(page.getByTestId('annotation')).toBeHidden();
  await expect(page.getByTestId('anno-abstract').first()).toBeVisible();
});
