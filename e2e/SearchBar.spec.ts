import { expect, test } from '@playwright/test';
import { checkQuery } from './helpers';

test.describe.configure({
  mode: 'parallel',
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('search-input').isVisible();
});

test('Input allows basic input', async ({ page }) => {
  await expect(page.getByTestId('search-input')).toBeFocused();
  await expect(page.getByTestId('search-input')).toHaveValue(``);
  await page.getByTestId('search-input').fill(`star abs:"black hole"`);
  await expect(page.getByTestId('search-input')).toHaveValue(`star abs:"black hole"`);
});

test('Input autocomplete dropdown basic functionality works', async ({ page }) => {
  const input = page.getByTestId('search-input');
  await input.fill(`au`);
  await input.press('ArrowDown');
  await input.press('Enter');

  await expect(input).toHaveValue(`author:""`);
  await expect(input).toBeFocused();

  // cursor should be in quotes, so we'll just start typing and see what happens
  await page.keyboard.type('Smith, A');
  await expect(input).toHaveValue(`author:"Smith, A"`);
});

test('Can clear the input', async ({ page }) => {
  const input = page.getByTestId('search-input');

  // initially should be no clear button
  await expect(page.getByTestId('search-clearbtn')).toBeHidden();
  await input.fill(`star abs:"black hole"`);
  await expect(page.getByTestId('search-clearbtn')).toBeVisible();
  await page.getByTestId('search-clearbtn').click();
  await expect(input).toHaveValue(``);
});

test('previews show when focusing on items in dropdown', async ({ page }) => {
  const input = page.getByTestId('search-input');
  await input.fill(`au`);
  await input.press('ArrowDown');
  await expect(input).toHaveValue(`author:""`);
  await input.press('ArrowDown');
  await expect(input).toHaveValue(`author:"^"`);
  await input.press('ArrowDown');
  await expect(input).toHaveValue(`au`);
  await input.press('ArrowUp');
  await expect(input).toHaveValue(`author:"^"`);
  await input.press('ArrowUp');
  await expect(input).toHaveValue(`author:""`);
  await input.press('ArrowUp');
  await expect(input).toHaveValue(`au`);
});

test('escape properly closes the dropdown', async ({ page }) => {
  const input = page.getByTestId('search-input');
  await input.fill(`au`);
  await expect(page.getByTestId('search-autocomplete-menu')).toBeVisible();
  await input.press('ArrowDown');
  await expect(input).toHaveValue(`author:""`);
  await input.press('Escape');
  await expect(input).toHaveValue(`au`);
  await expect(page.getByTestId('search-autocomplete-menu')).toBeHidden();
});

test('user is viewing preview, then types, control is sent back to input', async ({ page }) => {
  const input = page.getByTestId('search-input');
  await input.fill(`au`);
  await expect(page.getByTestId('search-autocomplete-menu')).toBeVisible();
  await input.press('ArrowDown');
  await expect(input).toHaveValue(`author:""`);
  await input.press('x');
  await expect(page.getByTestId('search-autocomplete-menu')).toBeHidden();
  await expect(input).toHaveValue(`aux`);
});

test('clicking on search examples updates input', async ({ page }) => {
  const examples = page.locator('button.search-example');
  const texts = await examples.allInnerTexts();
  const input = page.getByTestId('search-input');
  await examples.nth(1).click();
  await page.waitForTimeout(200);
  await examples.nth(2).click();
  await page.waitForTimeout(200);
  await examples.nth(3).click();
  await expect(input).toHaveValue(`${texts[1]} ${texts[2]} ${texts[3]}`);
});

test('quick search works properly', async ({ page }) => {
  const input = page.getByTestId('search-input');

  // click the author quick search button
  await page.getByRole('button', { name: 'author', exact: true }).click();
  await expect(input).toHaveValue(`author:""`);
  await expect(input).toBeFocused();
  await page.keyboard.type('Smith, A');
  await expect(input).toHaveValue(`author:"Smith, A"`);

  await page.getByTestId('allSearchTermsMenuToggle').click();
  await page.getByTestId('allSearchTermsMenu').isVisible();
  await page.keyboard.press('Escape');
  await page.getByTestId('allSearchTermsMenu').isHidden();
  await page.getByTestId('allSearchTermsInput').click();
  await page.getByTestId('allSearchTermsInput').fill('obj');
  await page.getByTestId('allSearchTermsInput').press('Enter');
  await expect(input).toHaveValue(`author:"Smith, A" object:`);
  await expect(page.getByTestId('allSearchTermsInput')).toHaveValue(``);
  await expect(page.getByTestId('allSearchTermsMenu')).toBeHidden();
});

test('Pressing enter starts search', async ({ page }) => {
  await page.getByTestId('search-input').fill(`author:"Smith, A"`);
  await page.getByTestId('search-input').press('Enter');
  await page.waitForURL('**/search?**');
  checkQuery(page, `author:"Smith, A"`);
});

test('clicking on the search button starts search', async ({ page }) => {
  await page.locator('search-input').isVisible();
  await page.getByTestId('search-input').fill(`author:"Smith, A"`);
  await page.getByTestId('search-submit').click();
  await page.waitForURL('**/search?**');
  checkQuery(page, `author:"Smith, A"`);
});

test('autocomplete menu works with mouse', async ({ page }) => {
  await page.getByTestId('search-input').fill(`au`);
  await page.getByTestId('search-autocomplete-menu').isVisible();
  await page.getByText('Author', { exact: true }).click();
  await expect(page.getByTestId('search-input')).toHaveValue(`author:""`);
  await expect(page.getByTestId('search-input')).toBeFocused();
  await page.keyboard.type('Smith, A');
  await expect(page.getByTestId('search-input')).toHaveValue(`author:"Smith, A"`);
});
