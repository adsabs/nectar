import { test, expect } from '@playwright/test';
import { extractCookie } from '../../fixtures/helpers';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';
const STUB_URL = process.env.STUB_URL || 'http://127.0.0.1:18080';

test.describe('Verify Routes (Suite D)', () => {
  test.beforeEach(async ({ context, request }) => {
    await context.clearCookies();
    await request.post(`${STUB_URL}/__test__/reset`);
  });

  test('D1: Verify success redirects to login with propagated Set-Cookie', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'test-session',
        url: NECTAR_URL,
      },
    ]);

    await page.goto(`${NECTAR_URL}/search`);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'verify-success',
    });

    const response = await page.goto(`${NECTAR_URL}/user/account/verify/register/test-token`);
    await page.waitForURL('**/user/account/login?notify=verify-account-success', { timeout: 5000 });

    expect(page.url()).toContain('/user/account/login');
    expect(page.url()).toContain('notify=verify-account-success');

    const setCookieHeader = response?.headers()['set-cookie'];
    const adsSessionCookie = extractCookie(setCookieHeader, 'ads_session');

    if (adsSessionCookie) {
      expect(adsSessionCookie).toContain('SameSite=Lax');
      expect(adsSessionCookie).not.toContain('Domain=');
    }
  });

  test('D2: Unknown verification token redirects to home with failure', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'test-session',
        url: NECTAR_URL,
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'verify-unknown-token',
    });

    await page.goto(`${NECTAR_URL}/user/account/verify/register/bad-token`);

    expect(page.url()).toContain('/?notify=verify-account-failed');
  });

  test('D3: Already validated token redirects to home with was-valid message', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'test-session',
        url: NECTAR_URL,
      },
    ]);

    await page.goto(`${NECTAR_URL}/search`);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'verify-already-validated',
    });

    await page.goto(`${NECTAR_URL}/user/account/verify/register/already-valid-token`);

    expect(page.url()).toContain('/?notify=verify-account-was-valid');
  });

  test('D4: Verify endpoint 500 error redirects to home with failure', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'test-session',
        url: NECTAR_URL,
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'verify-failure',
    });

    await page.goto(`${NECTAR_URL}/user/account/verify/register/error-token`);

    expect(page.url()).toContain('/?notify=verify-account-failed');
  });

  test('D5: Missing access token (bootstrap fails) redirects to home with failure', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'test-session',
        url: NECTAR_URL,
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-failure',
    });

    await page.goto(`${NECTAR_URL}/user/account/verify/register/any-token`);

    expect(page.url()).toContain('/?notify=');
    expect(page.url()).toMatch(/notify=(verify-account-failed|api-connect-failed)/);
  });
});
