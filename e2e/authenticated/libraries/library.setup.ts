import { expect, PlaywrightTestArgs } from '@playwright/test';

export const librarySetup = async (page: PlaywrightTestArgs['page']) => {
  await page.goto('/user/libraries');
  await expect(page.locator('#main-content').getByRole('alert')).toHaveText('No libraries found');
};

export const libraryTeardown = async (page: PlaywrightTestArgs['page']) => {};
