import { expect, PlaywrightTestArgs } from '@playwright/test';

export const checkQuery = (page: PlaywrightTestArgs['page'], query: string) => {
  const search = new URL(page.url()).searchParams;
  expect(search.get('q')).toBe(query);
};

export const changeAppMode = async (
  page: PlaywrightTestArgs['page'],
  mode: string,
  currentMode = 'General Science',
) => {
  await page.getByRole('group').locator('div').filter({ hasText: currentMode }).nth(1).click();
  await page.getByText(mode, { exact: true }).click();
  await page.keyboard.press('Enter');
};

export const doSearch = async (page: PlaywrightTestArgs['page'], searchString = '*:*') => {
  await page.getByTestId('search-input').focus();
  await page.keyboard.insertText(searchString);
  await page.getByTestId('search-submit').click();
};
