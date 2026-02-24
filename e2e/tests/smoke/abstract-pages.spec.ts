import { test } from '../../fixtures/nectar.fixture';

const TEST_BIBCODE = '2024ApJ...test..001A';

test.describe('Abstract Page Smoke Tests', () => {
  test.beforeEach(async ({ abstractPage, resetStub }) => {
    await abstractPage.clearCookies();
    await resetStub();
    await abstractPage.addSessionCookie('authenticated-session');
    await abstractPage.setScenarioHeader('bootstrap-authenticated');
  });

  test('Abstract page renders with article structure', async ({ abstractPage }) => {
    await abstractPage.gotoAbstract(TEST_BIBCODE);
    await abstractPage.expectVisible();
    await abstractPage.expectNavMenu();
  });

  const subpages = ['citations', 'references', 'coreads', 'similar', 'metrics', 'graphics'];

  for (const subpage of subpages) {
    test(`Abstract/${subpage} subpage renders`, async ({ abstractPage }) => {
      await abstractPage.gotoSubpage(TEST_BIBCODE, subpage);
      await abstractPage.expectNavMenu();
    });
  }
});
