import { expect, PlaywrightTestArgs } from '@playwright/test';

export const checkQuery = (page: PlaywrightTestArgs['page'], query: string) => {
  const search = new URL(page.url()).searchParams;
  expect(search.get('q')).toBe(query);
};
