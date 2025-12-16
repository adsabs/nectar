import { test, expect } from '@playwright/test';
import { getDomainFromUrl } from '../../fixtures/helpers';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';
const STUB_URL = process.env.STUB_URL || 'http://127.0.0.1:18080';
const DOMAIN = getDomainFromUrl(NECTAR_URL);

test.describe('Auth Routing (Suite C)', () => {
  test.beforeEach(async ({ context, request }) => {
    await context.clearCookies();
    await request.post(`${STUB_URL}/__test__/reset`);
  });

  test('C1: Protected route unauthenticated redirects to login', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'anonymous-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-anonymous',
    });

    await page.goto(`${NECTAR_URL}/user/libraries`);

    expect(page.url()).toContain('/user/account/login');
    expect(page.url()).toContain('next=');
    expect(page.url()).toContain('notify=login-required');
  });

  test('C2: Protected route authenticated allows access', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });

    await page.goto(`${NECTAR_URL}/search`);

    const response = await page.goto(`${NECTAR_URL}/user/settings`);

    expect(response?.status()).toBe(200);
    expect(page.url()).toContain('/user/settings');
  });

  test('C3: Login route authenticated redirects based on next param - valid relative path', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });

    await page.goto(`${NECTAR_URL}/search`);
    await page.goto(`${NECTAR_URL}/user/account/login?next=%2Fuser%2Fsettings`);

    expect(page.url()).toContain('/user/settings');
    expect(page.url()).toContain('notify=account-login-success');
  });

  test('C3b: Login route authenticated redirects to home for external next param', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });

    await page.goto(`${NECTAR_URL}/search`);
    await page.goto(`${NECTAR_URL}/user/account/login?next=https%3A%2F%2Fevil.example`);

    expect(page.url()).toContain('/?notify=account-login-success');
  });

  test('C3c: Login route authenticated redirects to home when no next param', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });

    await page.goto(`${NECTAR_URL}/search`);
    await page.goto(`${NECTAR_URL}/user/account/login`);

    expect(page.url()).toBe(`${NECTAR_URL}/`);
  });

  test('C4: Register route authenticated redirects to home', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });

    await page.goto(`${NECTAR_URL}/search`);
    await page.goto(`${NECTAR_URL}/user/account/register`);

    expect(page.url()).toBe(`${NECTAR_URL}/`);
  });

  test('C5: Forgot password route authenticated redirects to home', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'authenticated-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-authenticated',
    });

    await page.goto(`${NECTAR_URL}/search`);
    await page.goto(`${NECTAR_URL}/user/forgotpassword`);

    expect(page.url()).toBe(`${NECTAR_URL}/`);
  });
});
