import { test, expect } from '../../fixtures/nectar.fixture';

test.describe('@searchresults Search results', () => {
  test.beforeEach(async ({ searchResultsPage, resetStub }) => {
    await searchResultsPage.clearCookies();
    await resetStub();
    await searchResultsPage.addSessionCookie('authenticated-session');
    await searchResultsPage.setScenarioHeader('bootstrap-authenticated');
    await searchResultsPage.setSearchScenario('search-results');
  });

  test('renders the first page of results from the stub', async ({ searchResultsPage }) => {
    await searchResultsPage.gotoQuery('star');

    await expect(searchResultsPage.resultRows).toHaveCount(10);
    await expect(searchResultsPage.resultTitles.first()).toHaveText(/E2E Result 01/);
  });

  test('second page shows the next slice of results', async ({ searchResultsPage }) => {
    await searchResultsPage.gotoQuery('star');
    await expect(searchResultsPage.resultTitles.first()).toHaveText(/E2E Result 01/);

    await searchResultsPage.nextPageButton.click();

    await expect(searchResultsPage.resultTitles.first()).toHaveText(/E2E Result 11/);
    await expect(searchResultsPage.resultRows).toHaveCount(10);
  });

  test('empty scenario reports no results rather than rendering rows', async ({ page, searchResultsPage }) => {
    await searchResultsPage.setSearchScenario('search-empty');

    await searchResultsPage.gotoQuery('nothingmatchesthis');

    await expect(page.getByText('Sorry no results were found')).toBeVisible();
    await expect(searchResultsPage.resultRows).toHaveCount(0);
  });

  test('error scenario surfaces a retryable error, not an empty result set', async ({ page, searchResultsPage }) => {
    await searchResultsPage.setSearchScenario('search-error');

    await searchResultsPage.gotoQuery('star');

    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
    await expect(searchResultsPage.resultRows).toHaveCount(0);
    await expect(page.getByText('Sorry no results were found')).toHaveCount(0);
  });

  test('submitting a new query from the results page re-runs the search', async ({ page, searchResultsPage }) => {
    await searchResultsPage.gotoQuery('star');
    await expect(searchResultsPage.resultTitles.first()).toHaveText(/E2E Result 01/);

    const galaxyQuery = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/v1/search/query' && url.searchParams.get('q') === 'galaxy';
    });

    await searchResultsPage.search('galaxy');

    expect((await galaxyQuery).status()).toBe(200);
    await expect(page).toHaveURL(/[?&]q=galaxy/);
    await expect(searchResultsPage.resultRows).toHaveCount(10);
  });

  test('expanding a collapsed facet section queries that facet', async ({ page, searchResultsPage }) => {
    const institutionQueries: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('aff_facet_hier')) {
        institutionQueries.push(request.url());
      }
    });

    await searchResultsPage.gotoQuery('star');
    await expect(searchResultsPage.resultRows).toHaveCount(10);
    expect(institutionQueries, 'institutions facet queried before it was expanded').toEqual([]);

    await searchResultsPage.facetSectionToggle('Institutions').click();

    await expect.poll(() => institutionQueries.length).toBeGreaterThan(0);
  });
});
