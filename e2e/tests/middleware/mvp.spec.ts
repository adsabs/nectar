import { test, expect } from '../../fixtures/nectar.fixture';

test.describe('Middleware MVP', () => {
  test.beforeEach(async ({ searchPage, resetStub }) => {
    await searchPage.clearCookies();
    await resetStub();
  });

  test('Bootstrap failure redirects to home with error message', async ({ context, nectarUrl, request }) => {
    const freshPage = await context.newPage();

    await freshPage.setExtraHTTPHeaders({
      'x-test-scenario': 'bootstrap-failure',
    });

    await freshPage.goto(`${nectarUrl}/search`, { waitUntil: 'load' });
    await freshPage.waitForURL('**/?notify=api-connect-failed', {
      timeout: 5000,
    });

    expect(freshPage.url()).toContain('/?notify=api-connect-failed');

    const stubUrl = process.env.STUB_URL || 'http://127.0.0.1:18080';
    const response = await request.get(`${stubUrl}/__test__/calls`);
    const data = await response.json();
    expect(data.count).toBeGreaterThan(0);

    const failureCall = data.calls.find(
      (call: { endpoint: string; scenario: string }) =>
        call.endpoint === '/accounts/bootstrap' && call.scenario === 'bootstrap-failure',
    );
    expect(failureCall).toBeDefined();

    await freshPage.close();
  });
});
