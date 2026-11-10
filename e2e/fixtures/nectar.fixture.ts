/* eslint-disable react-hooks/rules-of-hooks -- Playwright fixture `use` is not React */
import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { LoginPage } from '../pages/login.page';
import { SearchPage } from '../pages/search.page';
import { SearchResultsPage } from '../pages/search-results.page';
import { RegisterPage } from '../pages/register.page';
import { ForgotPasswordPage } from '../pages/forgot-password.page';
import { VerifyPage } from '../pages/verify.page';
import { SettingsPage } from '../pages/settings.page';
import { LocalSettings } from '../../src/types';

export type NectarTestContext = {
  nectarUrl: string;
  homePage: HomePage;
  loginPage: LoginPage;
  searchPage: SearchPage;
  searchResultsPage: SearchResultsPage;
  registerPage: RegisterPage;
  forgotPasswordPage: ForgotPasswordPage;
  verifyPage: VerifyPage;
  settingsPage: SettingsPage;
  setTestScenario: (scenario: string) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- __NEXT_DATA__ is untyped
  getNextData: () => Promise<any>;
  assertCookieRewritten: (cookie: string | undefined, expectedValue: string) => void;
  resetStub: () => Promise<void>;
  suppressProductTour: void;
};

export type ProductTourVisibility = 'suppressed' | 'visible';

export type NectarTestOptions = {
  productTour: ProductTourVisibility;
};

const STUB_URL = process.env.STUB_URL || 'http://127.0.0.1:18080';

export const test = base.extend<NectarTestContext & NectarTestOptions>({
  nectarUrl: async ({}, use) => {
    await use(process.env.NECTAR_URL || process.env.BASE_URL || 'http://127.0.0.1:8000');
  },

  homePage: async ({ page, context, nectarUrl }, use) => {
    await use(new HomePage(page, context, nectarUrl));
  },

  loginPage: async ({ page, context, nectarUrl }, use) => {
    await use(new LoginPage(page, context, nectarUrl));
  },

  searchPage: async ({ page, context, nectarUrl }, use) => {
    await use(new SearchPage(page, context, nectarUrl));
  },

  searchResultsPage: async ({ page, context, nectarUrl }, use) => {
    await use(new SearchResultsPage(page, context, nectarUrl));
  },

  registerPage: async ({ page, context, nectarUrl }, use) => {
    await use(new RegisterPage(page, context, nectarUrl));
  },

  forgotPasswordPage: async ({ page, context, nectarUrl }, use) => {
    await use(new ForgotPasswordPage(page, context, nectarUrl));
  },

  verifyPage: async ({ page, context, nectarUrl }, use) => {
    await use(new VerifyPage(page, context, nectarUrl));
  },

  settingsPage: async ({ page, context, nectarUrl }, use) => {
    await use(new SettingsPage(page, context, nectarUrl));
  },

  setTestScenario: async ({ context }, use) => {
    await use(async (scenario: string) => {
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

  resetStub: async ({ request }, use) => {
    await use(async () => {
      await request.post(`${STUB_URL}/__test__/reset`);
    });
  },

  productTour: ['suppressed', { option: true }],

  suppressProductTour: [
    async ({ context, productTour }, use) => {
      if (productTour === 'visible') {
        await use();
        return;
      }
      const seenTourKeys = [
        LocalSettings.SEEN_LANDING_TOUR,
        LocalSettings.SEEN_RESULTS_TOUR,
        LocalSettings.SEEN_ABSTRACT_TOUR,
      ];
      await context.addInitScript((keys: string[]) => {
        keys.forEach((key) => window.localStorage.setItem(key, 'true'));
      }, seenTourKeys);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
