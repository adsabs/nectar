import { test as setup } from '@playwright/test';

setup.beforeEach(async ({ page }) => {
  await page.goto('/user/account/login');
});

setup('authenticate user 1', async ({ page }) => {
  await page.getByLabel('Email').fill('scix-testing-user1-30ae2ff4-49e1-49ef-8aae-3ef9d8399a80@mailslurp.net');
  await page.getByLabel('Password').fill('Testing123!');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForURL('/?notify=account-login-success');

  await page.context().storageState({ path: 'playwright/.auth/user1.json' });
});

setup('authenticate user 2', async ({ page }) => {
  await page.getByLabel('Email').fill('scix-testing-user2-4e1b4600-33aa-4346-94a7-1bd9b3d64b4c@mailslurp.net');
  await page.getByLabel('Password').fill('Testing123!');
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForURL('/?notify=account-login-success');

  await page.context().storageState({ path: 'playwright/.auth/user2.json' });
});
