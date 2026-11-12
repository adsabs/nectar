import { Page, BrowserContext, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = '/user/account/login';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  get emailInput(): Locator {
    return this.page.getByTestId('login-email');
  }

  get passwordInput(): Locator {
    return this.page.getByTestId('login-password');
  }

  get submitButton(): Locator {
    return this.page.getByTestId('login-submit');
  }

  async gotoWithNext(nextUrl: string): Promise<void> {
    await this.gotoWithParams(`?next=${encodeURIComponent(nextUrl)}`);
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async mockLoginSuccess(): Promise<void> {
    await this.page.route('**/api/auth/login', async (route) => {
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
