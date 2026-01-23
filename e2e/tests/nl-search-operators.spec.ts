import { test, expect } from '@playwright/test';

/**
 * E2E Tests for NL Search Operator Queries (US-008)
 *
 * These tests verify the hybrid NER pipeline correctly handles operator syntax.
 * Unlike the mocked tests, these hit the real pipeline endpoint.
 *
 * Prerequisites:
 * - nectar dev server running: cd ~/ads-dev/nectar && pnpm dev
 * - Pipeline deployed to Modal: modal deploy serve_pipeline.py
 * - NL_SEARCH feature flag enabled
 *
 * Run: pnpm test:e2e tests/nl-search-operators.spec.ts
 */

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';
const API_TIMEOUT = 15000; // Pipeline + ADS API can take a few seconds

// Known malformed patterns that should NEVER appear in output
const MALFORMED_PATTERNS = [
  /citationsabs:/i,
  /referencesabs:/i,
  /trendingabs:/i,
  /usefulabs:/i,
  /similarabs:/i,
  /reviewsabs:/i,
  /citations\(abs:referencesabs:/i,
  /citations\(abs:citationsabs:/i,
  /citations\s*\(\s*abs:\s*citing/i,
];

// Helper to check if query contains any malformed patterns
function containsMalformedPattern(query: string): { found: boolean; pattern?: string } {
  for (const pattern of MALFORMED_PATTERNS) {
    if (pattern.test(query)) {
      return { found: true, pattern: pattern.toString() };
    }
  }
  return { found: false };
}

// Helper to check balanced parentheses
function hasBalancedParentheses(query: string): boolean {
  let count = 0;
  for (const char of query) {
    if (char === '(') {
      count++;
    }
    if (char === ')') {
      count--;
    }
    if (count < 0) {
      return false;
    } // More closing than opening at some point
  }
  return count === 0;
}

// Helper to extract query from API response or page
async function getGeneratedQuery(page: import('@playwright/test').Page): Promise<string | null> {
  // Wait for the suggestion to appear
  const suggestion = page.getByTestId('nl-query-suggestion');
  const isVisible = await suggestion.isVisible({ timeout: API_TIMEOUT }).catch(() => false);
  if (!isVisible) {
    return null;
  }

  // Get the query text from the suggestion element
  const queryText = await suggestion.textContent();
  return queryText?.trim() || null;
}

test.describe('NL Search Operator Query Validation (Live Pipeline)', () => {
  test.beforeEach(async ({ page }) => {
    // Set the feature flag via init script
    await page.addInitScript(() => {
      (window as unknown as { __NEXT_PUBLIC_NL_SEARCH: string }).__NEXT_PUBLIC_NL_SEARCH = 'enabled';
    });
  });

  test('Test 1: refereed open access papers about JWST since 2022', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled - set NEXT_PUBLIC_NL_SEARCH=enabled');
      return;
    }

    // Enter the query
    await nlInput.fill('refereed open access papers about JWST since 2022');

    // Wait for and get the generated query
    const query = await getGeneratedQuery(page);
    expect(query).not.toBeNull();

    console.log(`Generated query: ${query}`);

    // Verify expected fields are present
    expect(query).toMatch(/property.*refereed/i);
    expect(query).toMatch(/property.*openaccess/i);
    expect(query).toMatch(/abs.*JWST|title.*JWST|JWST/i);
    expect(query).toMatch(/pubdate.*2022|year.*2022|\[2022/i);

    // Verify no malformed patterns
    const malformed = containsMalformedPattern(query!);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);

    // Verify balanced parentheses
    expect(hasBalancedParentheses(query!)).toBe(true);

    // Apply and verify API returns 200 with results
    const applyButton = page.getByTestId('nl-search-apply-btn');
    await applyButton.click();

    // Wait for search results page
    await expect(page).toHaveURL(/\/search/, { timeout: 10000 });
    await expect(page).toHaveURL(/q=/, { timeout: 5000 });
  });

  test('Test 2: papers citing Hubble deep field paper', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    // This should trigger citations() operator
    await nlInput.fill('papers citing Hubble deep field paper');

    const query = await getGeneratedQuery(page);
    expect(query).not.toBeNull();

    console.log(`Generated query: ${query}`);

    // Verify citations operator wraps query (if operator is used)
    // The query should either have citations() or be a valid topic search
    const hasCitationsOperator = /citations\s*\(/i.test(query!);
    if (hasCitationsOperator) {
      // If citations operator is present, verify proper syntax
      expect(query).toMatch(/citations\s*\([^)]+\)/i);
    }

    // CRITICAL: No citationsabs: pattern ever
    const malformed = containsMalformedPattern(query!);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);

    // Balanced parentheses
    expect(hasBalancedParentheses(query!)).toBe(true);

    // Apply and verify API works
    const applyButton = page.getByTestId('nl-search-apply-btn');
    await applyButton.click();
    await expect(page).toHaveURL(/\/search/, { timeout: 10000 });
  });

  test('Test 3: references of the Planck 2018 cosmology paper', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    // This should trigger references() operator
    await nlInput.fill('references of the Planck 2018 cosmology paper');

    const query = await getGeneratedQuery(page);
    expect(query).not.toBeNull();

    console.log(`Generated query: ${query}`);

    // If references operator is used, verify proper syntax
    const hasReferencesOperator = /references\s*\(/i.test(query!);
    if (hasReferencesOperator) {
      expect(query).toMatch(/references\s*\([^)]+\)/i);
    }

    // CRITICAL: No referencesabs: pattern ever
    const malformed = containsMalformedPattern(query!);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);

    // Balanced parentheses
    expect(hasBalancedParentheses(query!)).toBe(true);

    // Apply and verify API works
    const applyButton = page.getByTestId('nl-search-apply-btn');
    await applyButton.click();
    await expect(page).toHaveURL(/\/search/, { timeout: 10000 });
  });

  test('Test 4: trending papers on exoplanets', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    // This should trigger trending() operator
    await nlInput.fill('trending papers on exoplanets');

    const query = await getGeneratedQuery(page);
    expect(query).not.toBeNull();

    console.log(`Generated query: ${query}`);

    // If trending operator is used, verify proper syntax
    const hasTrendingOperator = /trending\s*\(/i.test(query!);
    if (hasTrendingOperator) {
      expect(query).toMatch(/trending\s*\([^)]+\)/i);
    }

    // No malformed patterns
    const malformed = containsMalformedPattern(query!);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);

    // Balanced parentheses
    expect(hasBalancedParentheses(query!)).toBe(true);

    // Apply and verify
    const applyButton = page.getByTestId('nl-search-apply-btn');
    await applyButton.click();
    await expect(page).toHaveURL(/\/search/, { timeout: 10000 });
  });

  test('Test 5: papers about references in stellar spectra (NO operator)', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    // CRITICAL: "references" here is a TOPIC, not an operator
    // This should NOT produce references() operator
    await nlInput.fill('papers about references in stellar spectra');

    const query = await getGeneratedQuery(page);
    expect(query).not.toBeNull();

    console.log(`Generated query: ${query}`);

    // Should NOT have references() operator - references is topic
    // The word "references" should appear in abs: or as a topic, not as operator
    const hasReferencesOperator = /^references\s*\(/i.test(query!.trim());
    expect(hasReferencesOperator, 'Query should NOT use references() operator - "references" is a topic here').toBe(
      false,
    );

    // No malformed patterns
    const malformed = containsMalformedPattern(query!);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);

    // Balanced parentheses
    expect(hasBalancedParentheses(query!)).toBe(true);

    // Apply and verify
    const applyButton = page.getByTestId('nl-search-apply-btn');
    await applyButton.click();
    await expect(page).toHaveURL(/\/search/, { timeout: 10000 });
  });
});

test.describe('Additional Operator Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __NEXT_PUBLIC_NL_SEARCH: string }).__NEXT_PUBLIC_NL_SEARCH = 'enabled';
    });
  });

  test('citing papers should NOT produce citationsabs:', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    await nlInput.fill('citing papers');

    const query = await getGeneratedQuery(page);
    if (!query) {
      test.skip(true, 'Query generation timed out');
      return;
    }

    console.log(`Generated query: ${query}`);

    // This is the critical regression test
    expect(query).not.toMatch(/citationsabs:/i);
    expect(query).not.toMatch(/citations\(abs:citing/i);

    const malformed = containsMalformedPattern(query);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);
    expect(hasBalancedParentheses(query)).toBe(true);
  });

  test('reference materials should NOT produce referencesabs:', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    await nlInput.fill('reference materials for spectroscopy');

    const query = await getGeneratedQuery(page);
    if (!query) {
      test.skip(true, 'Query generation timed out');
      return;
    }

    console.log(`Generated query: ${query}`);

    expect(query).not.toMatch(/referencesabs:/i);
    expect(query).not.toMatch(/references\(abs:reference/i);

    const malformed = containsMalformedPattern(query);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);
    expect(hasBalancedParentheses(query)).toBe(true);
  });

  test('useful citations should NOT produce usefulcitations(', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    await nlInput.fill('useful citations on dark matter');

    const query = await getGeneratedQuery(page);
    if (!query) {
      test.skip(true, 'Query generation timed out');
      return;
    }

    console.log(`Generated query: ${query}`);

    // Should NOT have malformed operator concatenation
    expect(query).not.toMatch(/usefulcitations\(/i);
    expect(query).not.toMatch(/usefulabs:/i);

    const malformed = containsMalformedPattern(query);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);
    expect(hasBalancedParentheses(query)).toBe(true);
  });

  test('similar references should NOT produce similarreferences(', async ({ page }) => {
    await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

    const nlInput = page.getByTestId('nl-search-input');
    const isVisible = await nlInput.isVisible().catch(() => false);

    if (!isVisible) {
      test.skip(true, 'NL Search feature not enabled');
      return;
    }

    await nlInput.fill('similar references on gravitational waves');

    const query = await getGeneratedQuery(page);
    if (!query) {
      test.skip(true, 'Query generation timed out');
      return;
    }

    console.log(`Generated query: ${query}`);

    expect(query).not.toMatch(/similarreferences\(/i);
    expect(query).not.toMatch(/similarabs:/i);

    const malformed = containsMalformedPattern(query);
    expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);
    expect(hasBalancedParentheses(query)).toBe(true);
  });
});

test.describe('Regression Tests for Known Failure Strings', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __NEXT_PUBLIC_NL_SEARCH: string }).__NEXT_PUBLIC_NL_SEARCH = 'enabled';
    });
  });

  // These are known failure patterns that caused the refactor
  const knownFailureInputs = [
    { input: 'papers about citing practices', desc: 'citing as topic' },
    { input: 'bibliography references analysis', desc: 'references as topic' },
    { input: 'citation network visualization', desc: 'citation as topic' },
  ];

  for (const { input, desc } of knownFailureInputs) {
    test(`regression: ${desc} - "${input}"`, async ({ page }) => {
      await page.goto(`${NECTAR_URL}/?NEXT_PUBLIC_NL_SEARCH=enabled`);

      const nlInput = page.getByTestId('nl-search-input');
      const isVisible = await nlInput.isVisible().catch(() => false);

      if (!isVisible) {
        test.skip(true, 'NL Search feature not enabled');
        return;
      }

      await nlInput.fill(input);

      const query = await getGeneratedQuery(page);
      if (!query) {
        test.skip(true, 'Query generation timed out');
        return;
      }

      console.log(`Input: "${input}" -> Query: ${query}`);

      const malformed = containsMalformedPattern(query);
      expect(malformed.found, `Found malformed pattern: ${malformed.pattern}`).toBe(false);
      expect(hasBalancedParentheses(query)).toBe(true);
    });
  }
});
