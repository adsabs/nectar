import { test } from '../../fixtures/nectar.fixture';

test.describe('Navigation Smoke Tests', () => {
  test.beforeEach(async ({ homePage, resetStub }) => {
    await homePage.clearCookies();
    await resetStub();
  });

  test('Home page loads successfully', async ({ homePage }) => {
    await homePage.addSessionCookie('anonymous-session');
    await homePage.setScenarioHeader('bootstrap-anonymous');

    await homePage.goto();

    homePage.urlEquals(`${homePage.baseUrl}/`);
  });

  test('Search page loads for authenticated user', async ({ searchPage }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.gotoAndExpect();
    searchPage.urlContains('/search');
  });

  test('Login page loads for anonymous user', async ({ loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

    await loginPage.goto();
    loginPage.urlContains('/user/account/login');
  });
});
