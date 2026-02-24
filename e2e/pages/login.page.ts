import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = '/user/account/login';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async gotoWithNext(nextUrl: string): Promise<void> {
    await this.gotoWithParams(`?next=${encodeURIComponent(nextUrl)}`);
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    // Chakra UI's explicit id="email" breaks FormLabel for/id association,
    // so getByLabel doesn't work. Use locator by input name instead.
    await this.page.locator('input[name="email"]').fill(email);
    await this.page.locator('input[name="password"]').fill(password);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: /submit/i }).click();
  }

  async mockLoginSuccess(): Promise<void> {
    await this.interceptRoute('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.mockLoginSuccess();
    await this.submit();
  }

  async expectVisible(): Promise<void> {
    await this.page.getByRole('heading', { name: /login/i }).waitFor({ state: 'visible' });
  }
}
