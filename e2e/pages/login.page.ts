import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = '/user/account/login';

  private readonly emailInput = 'input[name="email"]';
  private readonly passwordInput = 'input[name="password"]';
  private readonly submitButton = 'button[type="submit"]';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async gotoWithNext(nextUrl: string): Promise<void> {
    await this.gotoWithParams(`?next=${encodeURIComponent(nextUrl)}`);
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
  }

  async submit(): Promise<void> {
    await this.page.click(this.submitButton);
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
}
