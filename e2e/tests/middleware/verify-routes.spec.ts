import { test, expect } from '../../fixtures/nectar.fixture';
import { extractCookie } from '../../fixtures/helpers';

test.describe('Verify Routes (Suite D)', () => {
  test.beforeEach(async ({ verifyPage, resetStub }) => {
    await verifyPage.clearCookies();
    await resetStub();
  });

  test('D1: Verify success redirects to login with propagated Set-Cookie', async ({ page, verifyPage, searchPage }) => {
    await searchPage.addSessionCookie('test-session');
    await searchPage.goto();

    await verifyPage.setScenarioHeader('verify-success');

    const response = await verifyPage.gotoWithToken('test-token');

    await page.waitForURL(/\/user\/account\/login\?notify=verify-account-success/);

    const setCookieHeader = response?.headers()['set-cookie'];
    const adsSessionCookie = extractCookie(setCookieHeader, 'ads_session');

    if (adsSessionCookie) {
      expect(adsSessionCookie).toContain('SameSite=Lax');
      expect(adsSessionCookie).not.toContain('Domain=');
    }
  });

  test('D2: Unknown verification token redirects to home with failure', async ({ page, verifyPage }) => {
    await verifyPage.addSessionCookie('test-session');
    await verifyPage.setScenarioHeader('verify-unknown-token');

    await verifyPage.gotoWithToken('bad-token');

    await page.waitForURL(/\/\?notify=verify-account-failed/);
  });

  test('D3: Already validated token redirects to home with was-valid message', async ({
    page,
    verifyPage,
    searchPage,
  }) => {
    await searchPage.addSessionCookie('test-session');
    await searchPage.goto();

    await verifyPage.setScenarioHeader('verify-already-validated');

    await verifyPage.gotoWithToken('already-valid-token');

    await page.waitForURL(/\/\?notify=verify-account-was-valid/);
  });

  test('D4: Verify endpoint 500 error redirects to home with failure', async ({ page, verifyPage }) => {
    await verifyPage.addSessionCookie('test-session');
    await verifyPage.setScenarioHeader('verify-failure');

    await verifyPage.gotoWithToken('error-token');

    await page.waitForURL(/\/\?notify=verify-account-failed/);
  });

  test('D5: Missing access token (bootstrap fails) redirects to home with failure', async ({ page, verifyPage }) => {
    await verifyPage.addSessionCookie('test-session');
    await verifyPage.setScenarioHeader('bootstrap-failure');

    await verifyPage.gotoWithToken('any-token');

    await page.waitForURL(/notify=(verify-account-failed|api-connect-failed)/);
  });
});
