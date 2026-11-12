import { test, expect } from '../../fixtures/nectar.fixture';

test.describe('Navigation Smoke Tests', () => {
  test.beforeEach(async ({ homePage, resetStub }) => {
    await homePage.clearCookies();
    await resetStub();
  });

  test('Home page loads successfully', async ({ page, homePage }) => {
    await homePage.addSessionCookie('anonymous-session');
    await homePage.setScenarioHeader('bootstrap-anonymous');

    await homePage.goto();

    await expect(page).toHaveURL(`${homePage.baseUrl}/`);
  });

  test('Search page loads for authenticated user', async ({ page, searchPage }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    const response = await searchPage.goto();

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/search/);
  });

  test('Login page loads for anonymous user', async ({ page, loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

    await loginPage.goto();

    await expect(page).toHaveURL(/\/user\/account\/login/);
  });
});
