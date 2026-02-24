import { test, expect } from '../../fixtures/nectar.fixture';

test.describe('Auth Routing (Suite C)', () => {
  test.beforeEach(async ({ loginPage, resetStub }) => {
    await loginPage.clearCookies();
    await resetStub();
  });

  test('C1: Protected route unauthenticated redirects to login', async ({ page, loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioViaRoute('bootstrap-anonymous');

    const response = await page.goto(`${loginPage.baseUrl}/user/libraries`, { waitUntil: 'commit' });

    const finalUrl = response?.url() || page.url();
    expect(finalUrl).toContain('/user/account/login');
    expect(finalUrl).toContain('next=');
    expect(finalUrl).toContain('notify=login-required');
  });

  test('C2: Protected route authenticated allows access', async ({ settingsPage, searchPage }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    const response = await settingsPage.goto();

    expect(response?.status()).toBe(200);
    settingsPage.urlContains('/user/settings');
  });

  test('C3: Login route authenticated redirects based on next param - valid relative path', async ({
    loginPage,
    searchPage,
  }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await loginPage.gotoWithNext('/user/settings');

    loginPage.urlContains('/user/settings');
    loginPage.urlContains('notify=account-login-success');
  });

  test('C3b: Login route authenticated redirects to home for external next param', async ({
    loginPage,
    searchPage,
  }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await loginPage.gotoWithNext('https://evil.example');

    loginPage.urlContains('/?notify=account-login-success');
  });

  test('C3c: Login route authenticated redirects to home when no next param', async ({
    loginPage,
    searchPage,
    nectarUrl,
  }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await loginPage.goto();

    loginPage.urlEquals(`${nectarUrl}/`);
  });

  test('C4: Register route authenticated redirects to home', async ({ registerPage, searchPage, nectarUrl }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await registerPage.goto();

    registerPage.urlEquals(`${nectarUrl}/`);
  });

  test('C5: Forgot password route authenticated redirects to home', async ({ page, searchPage, nectarUrl }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    // Middleware redirects from the legacy /user/forgotpassword path.
    // The actual page lives at /user/account/forgotpassword.
    await page.goto(`${nectarUrl}/user/forgotpassword`);

    expect(page.url()).toBe(`${nectarUrl}/`);
  });

  test('C6: Login form redirects to next param after successful login', async ({ loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

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

  test('C7: Login form falls back to reload when next param is invalid', async ({ loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

    await loginPage.gotoWithNext('https://evil.example');

    await loginPage.fillCredentials('test@example.com', 'password123');
    await loginPage.mockLoginSuccess();
    await loginPage.setScenarioHeader('bootstrap-authenticated');
    await loginPage.submit();

    await loginPage.waitForLoadState('networkidle');

    loginPage.urlMatches(/\/(user\/account\/login|\?notify=account-login-success)?$/);
  });
});
