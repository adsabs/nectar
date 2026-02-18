import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class RegisterPage extends BasePage {
  protected readonly path = '/user/account/register';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }
}
