import { expect, test } from '@playwright/test';
import { checkQuery } from './helpers';

test.skip('blank form has correct defaults set', async ({ page }) => {
  await page.goto('/classic-form', { timeout: 60000 });
  await page.locator('form').isVisible();

  // of all radios, only the first is checked (All)
  for (const radio of await page.getByRole('radio').all()) {
    (await radio.getAttribute('value')) === 'and'
      ? await expect(radio).toBeChecked()
      : await expect(radio).not.toBeChecked();
  }

  // of all checkboxes, only the first is checked (Astronomy)
  for (const checkbox of await page.getByRole('checkbox').all()) {
    (await checkbox.getAttribute('value')) === 'astronomy'
      ? await expect(checkbox).toBeChecked()
      : await expect(checkbox).not.toBeChecked();
  }

  await expect(page.locator('#react-select-bibstem-picker-input')).toHaveValue('');
  await expect(page.getByTestId('sort')).toHaveText('Date');
});

// TODO: fix this test
test.skip('default form can be submitted, and is valid', async ({ page }) => {
  await page.goto('/classic-form');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL('**/search?**');
  expect(page.url()).toContain('/search?');
  const search = new URL(page.url()).searchParams;
  expect(search.getAll('sort')).toStrictEqual(['score desc', 'date desc']);
  expect(search.get('p')).toBe('1');
  checkQuery(page, 'collection:(astronomy)');
});

test('form can be filled out and submitted, and is valid', async ({ page }) => {
  await page.goto('/classic-form');
  // forces the page to wait for the form to be visible
  await page.locator('form').isVisible();

  await page.getByRole('textbox', { name: 'Author' }).fill('Smith, A\nJones, B');
  await page.getByRole('textbox', { name: 'Object' }).fill('IRAS\nHIP');
  await page.locator('input[name="pubdate_start"]').fill('2020/12');
  await page.locator('input[name="pubdate_end"]').fill('2022/01');
  await page.locator('input[name="title"]').fill('Black Hole');
  await page.locator('input[name="abstract_keywords"]').fill('Event Horizon');

  // property
  await page.getByLabel('Property').locator('span').nth(1).click();
  await page.getByLabel('Property').locator('span').nth(3).click();

  // publication
  await page.getByRole('group', { name: 'Publications' }).locator('label').click();
  await page.locator('#react-select-bibstem-picker-input').press('ArrowDown');
  await page.locator('#react-select-bibstem-picker-input').press('ArrowDown');
  await page.locator('#react-select-bibstem-picker-input').press('Tab');

  // sort
  await page.getByTestId('sort').getByText('Relevance').click();
  await page.getByTestId('sort').getByLabel('Sort', { exact: true }).press('ArrowDown');
  await page.getByTestId('sort').getByLabel('Sort', { exact: true }).press('ArrowDown');
  await page.getByTestId('sort').getByLabel('Sort', { exact: true }).press('Tab');

  // submit
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL('**/search?**');
  checkQuery(
    page,
    `collection:(astronomy) pubdate:[2020-12 TO 2022-01] author:("Smith, A" "Jones, B") object:(IRAS HIP) property:(refereed article) title:(Black Hole) abs:(Event Horizon) bibstem:(PhRvL)`,
  );
});

test('logic switches work properly', async ({ page }) => {
  await page.goto('/classic-form');
  // author
  await page.getByRole('textbox', { name: 'Author' }).fill('Smith, A\nJones, B');
  await page.getByRole('group', { name: 'Author' }).locator('span').nth(3).click();

  // object
  await page.getByRole('textbox', { name: 'Object' }).fill('IRAS\nHIP');
  await page.getByRole('group', { name: 'Object' }).locator('span').nth(3).click();

  // title
  await page.locator('input[name="title"]').fill(`"Black Hole" Galaxy`);
  await page.getByLabel('Title').getByText('Or').click();

  // abstract
  await page.locator('input[name="abstract_keywords"]').fill(`"Event Horizon" Singularity`);
  await page.getByLabel('Abstract / Keywords').getByText('Or', { exact: true }).click();

  // submit
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL('**/search?**');
  checkQuery(
    page,
    `collection:(astronomy) author:("Smith, A" OR "Jones, B") object:(IRAS OR HIP) title:("Black Hole" OR Galaxy) abs:("Event Horizon" OR Singularity)`,
  );
});

test('boolean switches work properly', async ({ page }) => {
  await page.goto('/classic-form');
  // title
  await page.locator('input[name="title"]').fill(`"Black Hole" Galaxy -Solar -"Milky Way"`);
  await page.getByLabel('Title').getByText('Boolean', { exact: true }).click();

  // abstract
  await page.locator('input[name="abstract_keywords"]').fill(`"Event Horizon" Singularity -Spin -"Black Hole"`);
  await page.getByLabel('Abstract / Keywords').getByText('Boolean', { exact: true }).click();

  // submit
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL('**/search?**');
  checkQuery(
    page,
    `collection:(astronomy) title:("Black Hole" Galaxy -Solar -"Milky Way") abs:("Event Horizon" Singularity -Spin -"Black Hole")`,
  );
});

test('author name single-author filter works properly', async ({ page }) => {
  await page.goto('/classic-form');
  await page.locator('form').isVisible();

  await page.getByRole('textbox', { name: 'Author' }).fill('^Smith, A$');

  // submit
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL('**/search?**');
  checkQuery(page, `collection:(astronomy) author:("^Smith, A") author_count:1`);
});
test('author name filters works properly', async ({ page }) => {
  await page.goto('/classic-form');
  await page.locator('form').isVisible();

  await page.getByRole('textbox', { name: 'Author' }).fill('=Smith, A\n-Jones, A');

  // submit
  await page.getByRole('button', { name: 'Search' }).click();
  await page.waitForURL('**/search?**');
  checkQuery(page, `collection:(astronomy) author:(="Smith, A" -"Jones, A")`);
});

test('Can get to classic form from landing page', async ({ page }) => {
  await page.goto('/');
  await page.locator('#theme-selector svg').click();
  await page.getByText('Astrophysics', { exact: true }).click();
  await page.getByRole('link', { name: 'Classic Form' }).click();
  await page.waitForURL('**/classic-form');
  expect(page.url()).toContain('/classic-form');
});
