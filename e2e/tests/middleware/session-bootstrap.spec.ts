import { test, expect } from '@playwright/test';
import { extractCookie, getDomainFromUrl } from '../../fixtures/helpers';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';
const STUB_URL = process.env.STUB_URL || 'http://127.0.0.1:18080';
const DOMAIN = getDomainFromUrl(NECTAR_URL);

test.describe('Session Bootstrap (Suite B)', () => {
  test.beforeEach(async ({ context, request }) => {
    await context.clearCookies();
    await request.post(`${STUB_URL}/__test__/reset`);
  });

  test('B1: Cold start creates sidecar session with cookie rewrite', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'seed-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-rotated-cookie',
    });

    const response = await page.goto(`${NECTAR_URL}/search`);
    expect(response?.status()).toBe(200);

    const setCookieHeader = response?.headers()['set-cookie'];
    const adsSessionCookie = extractCookie(setCookieHeader, 'ads_session');

    if (adsSessionCookie) {
      expect(adsSessionCookie).toContain('SameSite=Lax');
      expect(adsSessionCookie).not.toContain('Domain=');
    }

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'ads_session');
    expect(sessionCookie).toBeDefined();

    const sidecarCookie = cookies.find((c) => c.name === 'scix_session');
    expect(sidecarCookie).toBeDefined();
  });

  test('B2: Fast path skips redundant Set-Cookie when unchanged', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'unchanged-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-unchanged-cookie',
    });

    const response = await page.goto(`${NECTAR_URL}/search`);
    expect(response?.status()).toBe(200);

    const setCookieHeader = response?.headers()['set-cookie'];
    const adsSessionCookie = extractCookie(setCookieHeader, 'ads_session');

    expect(adsSessionCookie).toBeUndefined();
  });

  test('B3: Force refresh via header triggers bootstrap even with valid session', async ({ page, context, request }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'valid-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.goto(`${NECTAR_URL}/search`);

    await request.post(`${STUB_URL}/__test__/reset`);

    await page.setExtraHTTPHeaders({
      'x-refresh-token': '1',
    });

    await page.goto(`${NECTAR_URL}/search?_refresh=1`, { waitUntil: 'load' });
    await page.waitForLoadState('networkidle');

    const response = await request.get(`${STUB_URL}/__test__/calls`);
    const data = await response.json();

    expect(data.count).toBeGreaterThan(0);
    expect(data.calls.some((call: { endpoint: string }) => call.endpoint === '/accounts/bootstrap')).toBe(true);
  });

  test('B4: Bootstrap failure redirects to home with notify param', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'ads_session',
        value: 'test-session',
        domain: DOMAIN,
        path: '/',
      },
    ]);

    await page.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-failure',
    });

    await page.goto(`${NECTAR_URL}/search`, { waitUntil: 'load' });
    await page.waitForURL('**/?notify=api-connect-failed', { timeout: 5000 });

    expect(page.url()).toContain('/?notify=api-connect-failed');
  });
});
