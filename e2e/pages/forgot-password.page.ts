import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class ForgotPasswordPage extends BasePage {
  protected readonly path = '/user/account/forgotpassword';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async expectVisible(): Promise<void> {
    await this.page.getByRole('heading', { name: /forgot password/i }).waitFor({ state: 'visible' });
  }
}
