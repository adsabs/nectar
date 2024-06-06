import { expect, test } from '@playwright/test';
import { changeAppMode } from './helpers';

test('Landing Pages', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle(/NASA Science Explorer/);
  await expect(page).toHaveScreenshot('modern-form.png', { fullPage: true });

  // change mode to astrophysics so the tabs show up
  await changeAppMode(page, 'Astrophysics');
  await expect(page).toHaveScreenshot('modern-form-with-tabs.png', { fullPage: true });

  // on classic form
  await page.getByRole('link', { name: 'Classic Form' }).click();
  await expect(page).toHaveURL(/\/classic-form$/);
  await expect(page).toHaveTitle(/Classic Form/);
  await expect(page).toHaveScreenshot('classic-form.png', { fullPage: true });

  // on paper form
  await page.getByRole('link', { name: 'Paper Form' }).click();
  await expect(page).toHaveURL(/\/paper-form$/);
  await expect(page).toHaveTitle(/Paper Form/);
  await expect(page).toHaveScreenshot('paper-form.png', { fullPage: true });
});

test('Feedback Pages', async ({ page }) => {
  await page.goto('/');

  // Missing/Incorrect Record
  await page.getByRole('button', { name: 'Feedback' }).click();
  await page.getByRole('menuitem', { name: 'Missing/Incorrect Record' }).click();
  await expect(page.getByText(/submit a new bibliographic record/i)).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\/feedback\/missingrecord\?from=%2F$/);
  await expect(page).toHaveScreenshot('feedback-missing-incorrect-record.png', { fullPage: true });

  // Missing References
  await page.goto('/feedback/missingreferences');
  await expect(page.getByText(/submit one or more citations currently missing/i)).toBeVisible();
  await expect(page).toHaveScreenshot('feedback-missing-references.png', { fullPage: true });

  // Associated Articles
  await page.goto('/feedback/associatedarticles');
  await expect(page.getByText(/associated references are connected with links/i)).toBeVisible();
  await expect(page).toHaveScreenshot('feedback-associated-articles.png', { fullPage: true });

  // General Feedback
  await page.goto('/feedback/general');
  await expect(page.getByText(/you can also reach us at adshelp/i)).toBeVisible();
  await expect(page).toHaveScreenshot('feedback-general.png', { fullPage: true });
});
