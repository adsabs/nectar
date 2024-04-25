import { expect, test } from '@playwright/test';
import { routes, searchbar } from '../helpers';

test.describe.configure({
  mode: 'parallel',
});

test.skip(true, 'Classic Form - Results - Abstract');
test.skip(true, 'Paper Form - Results - Abstract');
test.skip(true, 'Journal Search - Results - Abstract');
test.skip(true, 'Bibcode Query - Results - Abstract');
test.skip(true, 'Result - Faceting, Sorting, Operations');

test('Modern Form - Results - Abstract', async ({ page }) => {
  const id = '1985ARA&A..23..169D';
  await page.goto(routes.home);
  await expect(page).toHaveScreenshot({ fullPage: true });
  await searchbar.submitQuery(page, `identifier:${id}`);
  await page.waitForURL(`/search*`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveScreenshot({ fullPage: true });
  await page.getByRole('link', { name: 'Radio emission' }).click();
  await page.waitForURL(`/abs/${id}/abstract`, { waitUntil: 'load' });
  await expect(page).toHaveScreenshot({ fullPage: true });

  // check for headings
  const headings = await page.getByRole('heading').all();
  expect(headings).toHaveLength(4);
  await expect(headings[0]).toHaveText(/.*Radio emission.*/i);
  await expect(headings[1]).toHaveText('Authors');
  await expect(headings[2]).toHaveText('Abstract');
  await expect(headings[3]).toHaveText('Details');

  // check for resource accordion
  await expect(page.getByRole('button', { name: 'Full Text Sources' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Data Products' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Related Materials' })).toBeVisible();

  // check for navigation
  await expect(page.getByRole('link', { name: 'Abstract' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'References' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Citations' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Similar Papers' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Metrics' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Co-Reads' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Volume Content' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Graphics' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Export Citation' })).toBeVisible();
});
