import { test, expect } from '../../fixtures/nectar.fixture';

const closeTourButton = 'Close Tour';
const sortOrderAnchor = '[data-tour="sort-order"]';
const TOUR_START_WINDOW_MS = 3000;

test.describe('@producttour Product tour', () => {
  test.beforeEach(async ({ searchResultsPage, resetStub }) => {
    await searchResultsPage.clearCookies();
    await resetStub();
    await searchResultsPage.addSessionCookie('authenticated-session');
    await searchResultsPage.setScenarioHeader('bootstrap-authenticated');
  });

  test('is suppressed by default even once its trigger has rendered', async ({ page, searchResultsPage }) => {
    await searchResultsPage.gotoQuery('star');

    await expect(searchResultsPage.resultRows).toHaveCount(10);
    await expect(page.locator(sortOrderAnchor)).toBeVisible();

    await page.waitForTimeout(TOUR_START_WINDOW_MS);

    await expect(page.getByRole('button', { name: closeTourButton })).toHaveCount(0);
  });

  test.describe('when a test opts back in', () => {
    test.use({ productTour: 'visible' });

    test('runs on a first visit to the results page', async ({ page, searchResultsPage }) => {
      await searchResultsPage.gotoQuery('star');

      await expect(page.getByRole('button', { name: closeTourButton })).toBeVisible();
    });
  });
});
