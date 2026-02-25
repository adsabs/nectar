import { test } from '../../fixtures/nectar.fixture';

const TEST_BIBCODE = '2024ApJ...test..001A';

test.describe('Abstract Page Navigation Workflow', () => {
  test.beforeEach(async ({ abstractPage, resetStub }) => {
    await abstractPage.clearCookies();
    await resetStub();
    await abstractPage.addSessionCookie('authenticated-session');
    await abstractPage.setScenarioHeader('bootstrap-authenticated');
  });

  test('User can navigate between abstract tabs', async ({ abstractPage }) => {
    await abstractPage.gotoAbstract(TEST_BIBCODE);
    await abstractPage.expectVisible();
    await abstractPage.expectNavMenu();

    await abstractPage.clickNavTab('Citations');
    await abstractPage.waitForUrl(/\/citations/);
    abstractPage.urlContains(`/abs/${TEST_BIBCODE}/citations`);

    await abstractPage.clickNavTab('References');
    await abstractPage.waitForUrl(/\/references/);
    abstractPage.urlContains(`/abs/${TEST_BIBCODE}/references`);

    await abstractPage.clickNavTab('Abstract');
    await abstractPage.waitForUrl(/\/abstract/);
    abstractPage.urlContains(`/abs/${TEST_BIBCODE}/abstract`);
  });
});
