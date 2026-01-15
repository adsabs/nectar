import { test, expect } from '@playwright/test';

const NECTAR_URL = process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000';
const STUB_URL = process.env.STUB_URL || 'http://127.0.0.1:18080';

test.describe('Middleware MVP', () => {
  test.beforeEach(async ({ context, request }) => {
    await context.clearCookies();
    await request.post(`${STUB_URL}/__test__/reset`);
  });

  test('Bootstrap failure redirects to home with error message', async ({ request, context }) => {
    const freshPage = await context.newPage();

    await freshPage.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-failure',
    });

    await freshPage.goto(`${NECTAR_URL}/search`, { waitUntil: 'load' });
    await freshPage.waitForURL('**/?notify=api-connect-failed', { timeout: 5000 });

    expect(freshPage.url()).toContain('/?notify=api-connect-failed');

    const response = await request.get(`${STUB_URL}/__test__/calls`);
    const data = await response.json();
    expect(data.count).toBeGreaterThan(0);

    // Find the bootstrap-failure call (tests run in parallel, so filter by scenario)
    const failureCall = data.calls.find(
      (call: { endpoint: string; scenario: string }) =>
        call.endpoint === '/accounts/bootstrap' && call.scenario === 'bootstrap-failure',
    );
    expect(failureCall).toBeDefined();

    await freshPage.close();
  });
});
