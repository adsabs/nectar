import { test, expect } from '../../fixtures/nectar.fixture';

test.describe('Auth Routing (Suite C)', () => {
  test.beforeEach(async ({ loginPage, resetStub }) => {
    await loginPage.clearCookies();
    await resetStub();
  });

  test('C1: Protected route unauthenticated redirects to login', async ({ page, loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioViaRoute('bootstrap-anonymous');

    await page.goto(`${loginPage.baseUrl}/user/libraries`, { waitUntil: 'commit' });

    await page.waitForURL((url) => {
      const target = new URL(url);
      return (
        target.pathname === '/user/account/login' &&
        target.searchParams.has('next') &&
        target.searchParams.get('notify') === 'login-required'
      );
    });
  });

  test('C2: Protected route authenticated allows access', async ({ page, settingsPage, searchPage }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    const response = await settingsPage.goto();

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/user\/settings/);
  });

  test('C3: Login route authenticated redirects based on next param - valid relative path', async ({
    page,
    loginPage,
    searchPage,
  }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await loginPage.gotoWithNext('/user/settings');

    await page.waitForURL(/\/user\/settings/);
  });

  test('C3b: Login route authenticated redirects to home for external next param', async ({
    page,
    loginPage,
    searchPage,
  }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await loginPage.gotoWithNext('https://evil.example');

    await page.waitForURL(/\/\?notify=account-login-success/);
  });

  test('C3c: Login route authenticated redirects to home when no next param', async ({
    page,
    loginPage,
    searchPage,
    nectarUrl,
  }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await loginPage.goto();

    await expect(page).toHaveURL(`${nectarUrl}/`);
  });

  test('C4: Register route authenticated redirects to home', async ({ page, registerPage, searchPage, nectarUrl }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await registerPage.goto();

    await expect(page).toHaveURL(`${nectarUrl}/`);
  });

  test('C5: Forgot password route authenticated redirects to home', async ({
    page,
    forgotPasswordPage,
    searchPage,
    nectarUrl,
  }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.goto();
    await forgotPasswordPage.goto();

    await expect(page).toHaveURL(`${nectarUrl}/`);
  });

  test('C6: Login form redirects to next param after successful login', async ({ page, loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

    await loginPage.gotoWithNext('/search?q=test');

    await expect(page).toHaveURL(/\/user\/account\/login/);

    await loginPage.fillCredentials('test@example.com', 'password123');
    await loginPage.mockLoginSuccess();
    await loginPage.setScenarioHeader('bootstrap-authenticated');
    await loginPage.submit();

    await page.waitForURL(/\/search\?.*q=test/);
  });

  test('C7: Login form falls back to reload when next param is invalid', async ({ page, loginPage, nectarUrl }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

    await loginPage.gotoWithNext('https://evil.example');

    const loginUrl = page.url();

    await loginPage.fillCredentials('test@example.com', 'password123');
    await loginPage.mockLoginSuccess();

    const reloadRequest = page.waitForRequest(
      (request) => request.isNavigationRequest() && request.url() === loginUrl,
      { timeout: 10_000 },
    );
    await loginPage.submit();

    const response = await (await reloadRequest).response();
    expect(response?.status()).toBe(200);

    const url = new URL(page.url());
    expect(url.origin).toBe(nectarUrl);
    expect(url.pathname).toBe('/user/account/login');
  });
});
