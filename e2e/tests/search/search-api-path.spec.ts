import { test, expect } from '../../fixtures/nectar.fixture';

test.describe('Search API path', () => {
  test.beforeEach(async ({ searchResultsPage, resetStub }) => {
    await searchResultsPage.clearCookies();
    await resetStub();
    await searchResultsPage.addSessionCookie('authenticated-session');
    await searchResultsPage.setScenarioHeader('bootstrap-authenticated');
  });

  test('browser reaches the search api through the app origin', async ({ page, searchResultsPage }) => {
    const searchResponse = page.waitForResponse((response) => response.url().includes('/search/query'));

    await searchResultsPage.gotoQuery('star');
    const response = await searchResponse;

    expect(new URL(response.url()).pathname).toBe('/v1/search/query');
    expect(response.status()).toBe(200);
    await expect(searchResultsPage.resultRows).toHaveCount(10);
  });
});
