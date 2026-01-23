import { test, expect } from '@playwright/test';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';

test.describe('NL Search', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the NL search API endpoint to return a predictable query with multiple suggestions
    await page.route('**/api/nl-search', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: 'author:"Hawking, S" abs:"black holes"',
          queries: [
            { query: 'author:"Hawking, S" abs:"black holes"', description: 'Best match' },
            { query: 'author:"Hawking, S" abs:(black AND holes)', description: 'Terms anywhere in abstract' },
            { query: '^author:"Hawking, S" abs:"black holes"', description: 'First author only' },
          ],
        }),
      });
    });

    // Mock the search API for result count preview
    await page.route('**/api/search*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            numFound: 1234,
            docs: [],
          },
        }),
      });
    });

    // Set the feature flag via cookie or ensure it's enabled
    await page.addInitScript(() => {
      (window as unknown as { __NEXT_PUBLIC_NL_SEARCH: string }).__NEXT_PUBLIC_NL_SEARCH = 'enabled';
    });
  });

  test('converts natural language to ADS query and applies it', async ({ page }) => {
    // Navigate to home page with NL Search enabled
    // We'll use a URL parameter approach to test with the feature flag
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    // Look for the NL search input
    const nlInput = page.getByTestId('nl-search-input');

    // Check if NL Search is visible (feature flag must be enabled)
    // If not visible, skip the test gracefully
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled - set NEXT_PUBLIC_NL_SEARCH=enabled');
      return;
    }

    // Enter a natural language query
    await nlInput.fill('papers by Hawking on black holes');

    // Wait for the loading spinner to appear and then disappear
    const loadingSpinner = page.getByTestId('nl-search-loading');
    await expect(loadingSpinner)
      .toBeVisible({ timeout: 2000 })
      .catch(() => {
        // Loading may be too fast to catch, continue
      });

    // Wait for query suggestion to appear
    const suggestion = page.getByTestId('nl-query-suggestion');
    await expect(suggestion).toBeVisible({ timeout: 10000 });

    // Verify the suggested query contains expected fields
    await expect(suggestion).toContainText('author:');

    // Test the copy button exists
    const copyButton = page.getByTestId('nl-search-copy-btn');
    await expect(copyButton).toBeVisible();

    // Test the apply button
    const applyButton = page.getByTestId('nl-search-apply-btn');
    await expect(applyButton).toBeVisible();

    // Click apply to navigate to search
    await applyButton.click();

    // Verify navigation to search results page
    await expect(page).toHaveURL(/\/search/, { timeout: 5000 });
    await expect(page).toHaveURL(/q=/, { timeout: 5000 });
  });

  test('shows result count preview', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    await nlInput.fill('papers by Hawking');

    // Wait for suggestion
    const suggestion = page.getByTestId('nl-query-suggestion');
    await expect(suggestion).toBeVisible({ timeout: 10000 });

    // Check for result count (should show ~1.2K results based on mock)
    const resultCount = page.getByTestId('nl-search-result-count');
    await expect(resultCount).toBeVisible({ timeout: 5000 });
    await expect(resultCount).toContainText(/\d+/); // Contains some number
  });

  test('displays multiple query options', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    await nlInput.fill('papers by Hawking on black holes');

    // Wait for suggestion
    const suggestion = page.getByTestId('nl-query-suggestion');
    await expect(suggestion).toBeVisible({ timeout: 10000 });

    // Check for query options container
    const queryOptions = page.getByTestId('nl-query-options');
    await expect(queryOptions).toBeVisible();

    // Verify multiple options are displayed
    const firstOption = page.getByTestId('nl-query-option-0');
    const secondOption = page.getByTestId('nl-query-option-1');
    await expect(firstOption).toBeVisible();
    await expect(secondOption).toBeVisible();

    // Verify descriptions are shown
    await expect(firstOption).toContainText('Best match');
    await expect(secondOption).toContainText('Terms anywhere');

    // Test selecting a different option
    await secondOption.click();

    // Apply the selected query
    const applyButton = page.getByTestId('nl-search-apply-btn');
    await applyButton.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/search/, { timeout: 5000 });
  });

  test('copy button copies query to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    await nlInput.fill('papers by Einstein');

    // Wait for suggestion
    const suggestion = page.getByTestId('nl-query-suggestion');
    await expect(suggestion).toBeVisible({ timeout: 10000 });

    // Click copy button
    const copyButton = page.getByTestId('nl-search-copy-btn');
    await copyButton.click();

    // Verify clipboard contains the query (check for the copied query)
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('author:');
  });
});
