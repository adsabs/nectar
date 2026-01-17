import { test, expect } from '@playwright/test';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';

test.describe('Export Citation URL Persistence', () => {
  test('custom format URL should not redirect to bibtex', async ({ page }) => {
    // This is the URL that should work - format=custom with customFormat parameter
    const customFormatUrl = `${NECTAR_URL}/search/exportcitation/custom?q=star&customFormat=testing`;

    // Navigate to the custom format URL
    await page.goto(customFormatUrl);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // The URL should still contain format=custom, not bibtex
    const currentUrl = page.url();

    expect(currentUrl).toContain('/exportcitation/custom');
    expect(currentUrl).not.toContain('/exportcitation/bibtex');
  });

  test('custom format URL with all params should preserve them', async ({ page }) => {
    // Full URL with all export parameters
    const fullUrl = `${NECTAR_URL}/search/exportcitation/custom?q=star&customFormat=testing+testing&authorcutoff=10&maxauthor=10&keyformat=%25R&journalformat=1`;

    await page.goto(fullUrl);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();

    // Format should remain custom
    expect(currentUrl).toContain('/exportcitation/custom');

    // customFormat should be preserved
    expect(currentUrl).toContain('customFormat=');
  });

  test('bibtex format URL should remain bibtex', async ({ page }) => {
    const bibtexUrl = `${NECTAR_URL}/search/exportcitation/bibtex?q=star`;

    await page.goto(bibtexUrl);
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();

    expect(currentUrl).toContain('/exportcitation/bibtex');
  });

  test('custom format URL should not change after page interaction', async ({ page }) => {
    // Navigate to custom format URL
    const customFormatUrl = `${NECTAR_URL}/search/exportcitation/custom?q=star&customFormat=MY_CUSTOM_FORMAT`;

    await page.goto(customFormatUrl);
    await page.waitForLoadState('networkidle');

    // Wait a moment for any potential redirect
    await page.waitForTimeout(2000);

    // URL should still be custom
    const currentUrl = page.url();
    expect(currentUrl).toContain('/exportcitation/custom');
    expect(currentUrl).toContain('customFormat=');
  });
});
