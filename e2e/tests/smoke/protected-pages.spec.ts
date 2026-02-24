import { test } from '../../fixtures/nectar.fixture';

test.describe('Protected Page Smoke Tests', () => {
  test.beforeEach(async ({ searchPage, resetStub }) => {
    await searchPage.clearCookies();
    await resetStub();
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');
    await searchPage.goto();
  });

  test('Libraries page renders for authenticated user', async ({ librariesPage }) => {
    await librariesPage.goto();
    await librariesPage.expectVisible();
  });

  test('Settings/application page renders for authenticated user', async ({ settingsPage }) => {
    await settingsPage.goto();
    await settingsPage.expectVisible();
  });

  test('Notifications page renders for authenticated user', async ({ notificationsPage }) => {
    await notificationsPage.goto();
    await notificationsPage.expectVisible();
  });
});
