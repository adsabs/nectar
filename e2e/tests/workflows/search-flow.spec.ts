import { test } from '../../fixtures/nectar.fixture';

test.describe('Search Flow Workflow', () => {
  test.beforeEach(async ({ homePage, resetStub }) => {
    await homePage.clearCookies();
    await resetStub();
  });

  test('Anonymous user can search from home page and see results', async ({ homePage, searchPage }) => {
    await homePage.addSessionCookie('anonymous-session');
    await homePage.setScenarioHeader('bootstrap-anonymous');

    await homePage.goto();
    await homePage.expectVisible();

    await homePage.search('black holes');

    await searchPage.waitForUrl(/\/search/, { waitUntil: 'commit' });
    searchPage.urlContains('q=black');

    await searchPage.expectVisible();
  });
});
