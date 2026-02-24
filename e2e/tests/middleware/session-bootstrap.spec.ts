import { test, expect } from '../../fixtures/nectar.fixture';
import { extractCookie } from '../../fixtures/helpers';

test.describe('Session Bootstrap (Suite B)', () => {
  test.beforeEach(async ({ searchPage, resetStub }) => {
    await searchPage.clearCookies();
    await resetStub();
  });

  test('B1: Cold start creates sidecar session with cookie rewrite', async ({ searchPage }) => {
    await searchPage.addSessionCookie('seed-session');
    await searchPage.setScenarioHeader('bootstrap-rotated-cookie');

    const response = await searchPage.gotoAndExpect();
    expect(response.status()).toBe(200);

    const setCookieHeader = response.headers()['set-cookie'];
    const adsSessionCookie = extractCookie(setCookieHeader, 'ads_session');

    if (adsSessionCookie) {
      expect(adsSessionCookie).toContain('SameSite=Lax');
      expect(adsSessionCookie).not.toContain('Domain=');
    }

    const cookies = await searchPage.getCookies();
    expect(cookies.find((c) => c.name === 'ads_session')).toBeDefined();
    expect(cookies.find((c) => c.name === 'scix_session')).toBeDefined();
  });

  test('B2: Fast path skips redundant Set-Cookie when unchanged', async ({ searchPage }) => {
    await searchPage.addSessionCookie('unchanged-session');
    await searchPage.setScenarioHeader('bootstrap-unchanged-cookie');

    const response = await searchPage.gotoAndExpect();
    expect(response.status()).toBe(200);

    const setCookieHeader = response.headers()['set-cookie'];
    const adsSessionCookie = extractCookie(setCookieHeader, 'ads_session');
    expect(adsSessionCookie).toBeUndefined();
  });

  test('B3: Force refresh via header triggers bootstrap even with valid session', async ({
    searchPage,
    resetStub,
    request,
  }) => {
    await searchPage.addSessionCookie('valid-session');
    await searchPage.goto();

    await resetStub();

    await searchPage.setExtraHeaders({ 'x-refresh-token': '1' });
    await searchPage.gotoWithParams('?_refresh=1', { waitUntil: 'load' });
    await searchPage.waitForLoadState('networkidle');

    const stubUrl = process.env.STUB_URL || 'http://127.0.0.1:18080';
    const response = await request.get(`${stubUrl}/__test__/calls`);
    const data = await response.json();

    expect(data.count).toBeGreaterThan(0);
    expect(data.calls.some((call: { endpoint: string }) => call.endpoint === '/accounts/bootstrap')).toBe(true);
  });

  test('B4: Bootstrap failure redirects to home with notify param', async ({ searchPage }) => {
    await searchPage.addSessionCookie('test-session');
    await searchPage.setScenarioHeader('bootstrap-failure');

    await searchPage.goto({ waitUntil: 'load' });
    await searchPage.waitForUrl('**/?notify=api-connect-failed', {
      timeout: 5000,
    });

    searchPage.urlContains('/?notify=api-connect-failed');
  });
});
