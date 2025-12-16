import { test as base, expect } from '@playwright/test';

export type NectarTestContext = {
  nectarUrl: string;
  setTestScenario: (scenario: string) => Promise<void>;
  getNextData: () => Promise<any>;
  assertCookieRewritten: (cookie: string | undefined, expectedValue: string) => void;
};

export const test = base.extend<NectarTestContext>({
  nectarUrl: async ({}, use) => {
    await use(process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000');
  },

  setTestScenario: async ({ context }, use) => {
    let currentScenario: string | null = null;

    await use(async (scenario: string) => {
      currentScenario = scenario;
      await context.route('**/*', async (route) => {
        const headers = route.request().headers();
        if (scenario) {
          headers['x-test-scenario'] = scenario;
        }
        await route.continue({ headers });
      });
    });
  },

  getNextData: async ({ page }, use) => {
    await use(async () => {
      const content = await page.locator('#__NEXT_DATA__').textContent();
      if (!content) {
        throw new Error('__NEXT_DATA__ not found');
      }
      return JSON.parse(content);
    });
  },

  assertCookieRewritten: async ({}, use) => {
    await use((cookie: string | undefined, expectedValue: string) => {
      expect(cookie).toBeDefined();
      expect(cookie).toContain(`ads_session=${expectedValue}`);
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).not.toContain('Domain=');
    });
  },
});

export { expect };
