import { test } from '../../fixtures/nectar.fixture';

test.describe('Auth-Gated Navigation Workflow', () => {
  test.beforeEach(async ({ loginPage, resetStub }) => {
    await loginPage.clearCookies();
    await resetStub();
  });

  test('Anonymous user accessing protected route is redirected to login with next param', async ({
    page,
    loginPage,
  }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioViaRoute('bootstrap-anonymous');

    await page.goto(`${loginPage.baseUrl}/user/libraries`, {
      waitUntil: 'commit',
    });

    await loginPage.waitForUrl(/\/user\/account\/login/);
    loginPage.urlContains('next=');
    loginPage.urlContains('notify=login-required');

    await loginPage.expectVisible();
  });

  test('Authenticated user can submit login form and redirect to non-protected destination', async ({ loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

    // Navigate directly to login with a non-protected next destination
    await loginPage.gotoWithNext('/search?q=test');

    loginPage.urlContains('/user/account/login');

    await loginPage.fillCredentials('test@example.com', 'password123');
    await loginPage.mockLoginSuccess();
    await loginPage.setScenarioHeader('bootstrap-authenticated');
    await loginPage.submit();

    await loginPage.waitForUrl(/\/search/, { waitUntil: 'commit' });
    loginPage.urlContains('/search');
    loginPage.urlContains('q=test');
  });
});
