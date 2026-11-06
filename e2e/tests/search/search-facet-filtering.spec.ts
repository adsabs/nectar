import { test, expect } from '../../fixtures/nectar.fixture';

test.describe('@wip Search facet filtering', () => {
  test.beforeEach(async ({ searchResultsPage, resetStub }) => {
    await searchResultsPage.clearCookies();
    await resetStub();
    await searchResultsPage.addSessionCookie('authenticated-session');
    await searchResultsPage.setScenarioHeader('bootstrap-authenticated');
  });

  test('selecting a facet value narrows the result list', async ({ searchResultsPage }) => {
    await searchResultsPage.gotoQuery('star');
    await expect(searchResultsPage.resultRows).toHaveCount(10);

    await searchResultsPage.facetSectionToggle('Institutions').click();
    await expect(searchResultsPage.facetRootItems.first()).toBeVisible();

    await searchResultsPage.facetRootItems.first().click();

    await expect(searchResultsPage.resultRows).not.toHaveCount(10);
  });
});
