import { test } from '../../fixtures/nectar.fixture';

test.describe('Public Page Smoke Tests', () => {
  test.beforeEach(async ({ homePage, resetStub }) => {
    await homePage.clearCookies();
    await resetStub();
  });

  test('Home page renders search form', async ({ homePage }) => {
    await homePage.addSessionCookie('anonymous-session');
    await homePage.setScenarioHeader('bootstrap-anonymous');

    await homePage.goto();
    await homePage.expectVisible();
  });

  test('Search page renders for authenticated user', async ({ searchPage }) => {
    await searchPage.addSessionCookie('authenticated-session');
    await searchPage.setScenarioHeader('bootstrap-authenticated');

    await searchPage.gotoAndExpect();
    await searchPage.expectVisible();
  });

  test('Classic form page renders', async ({ classicFormPage }) => {
    await classicFormPage.addSessionCookie('anonymous-session');
    await classicFormPage.setScenarioHeader('bootstrap-anonymous');

    await classicFormPage.goto();
    await classicFormPage.expectVisible();
  });

  test('Paper form page renders', async ({ paperFormPage }) => {
    await paperFormPage.addSessionCookie('anonymous-session');
    await paperFormPage.setScenarioHeader('bootstrap-anonymous');

    await paperFormPage.goto();
    await paperFormPage.expectVisible();
  });

  test('Journals database page renders', async ({ journalsDbPage }) => {
    await journalsDbPage.addSessionCookie('anonymous-session');
    await journalsDbPage.setScenarioHeader('bootstrap-anonymous');

    await journalsDbPage.goto();
    await journalsDbPage.expectVisible();
  });

  test('Login page renders for anonymous user', async ({ loginPage }) => {
    await loginPage.addSessionCookie('anonymous-session');
    await loginPage.setScenarioHeader('bootstrap-anonymous');

    await loginPage.goto();
    await loginPage.expectVisible();
  });

  test('Register page renders for anonymous user', async ({ registerPage }) => {
    await registerPage.addSessionCookie('anonymous-session');
    await registerPage.setScenarioHeader('bootstrap-anonymous');

    await registerPage.goto();
    await registerPage.expectVisible();
  });

  test('Forgot password page renders for anonymous user', async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.addSessionCookie('anonymous-session');
    await forgotPasswordPage.setScenarioHeader('bootstrap-anonymous');

    await forgotPasswordPage.goto();
    await forgotPasswordPage.expectVisible();
  });
});

test.describe('Feedback Page Smoke Tests', () => {
  test.beforeEach(async ({ feedbackPage, resetStub }) => {
    await feedbackPage.clearCookies();
    await resetStub();
  });

  const feedbackTypes = ['general', 'missingrecord', 'missingreferences', 'associatedarticles'];

  for (const type of feedbackTypes) {
    test(`Feedback/${type} page renders`, async ({ feedbackPage }) => {
      await feedbackPage.addSessionCookie('anonymous-session');
      await feedbackPage.setScenarioHeader('bootstrap-anonymous');

      await feedbackPage.gotoFeedbackType(type);
      await feedbackPage.expectVisible();
    });
  }
});
