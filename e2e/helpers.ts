import { expect, Page, PlaywrightTestArgs } from '@playwright/test';

export const checkQuery = (page: PlaywrightTestArgs['page'], query: string) => {
  const search = new URL(page.url()).searchParams;
  expect(search.get('q')).toBe(query);
};

export const routes = {
  home: '/',
  classicForm: '/classic-form',
  paperForm: '/paper-form',
};

export const searchbar = {
  async submitQuery(page: Page, query?: string) {
    await page.getByTestId('search-input').fill(query);
    await page.getByTestId('search-input').press('Enter');
  },
};
