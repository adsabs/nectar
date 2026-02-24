import { Page, BrowserContext, Response } from '@playwright/test';
import { BasePage } from './base.page';

export class VerifyPage extends BasePage {
  protected readonly path = '/user/account/verify/register';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async gotoWithToken(
    token: string,
    options?: { waitUntil?: 'load' | 'commit' | 'networkidle' },
  ): Promise<Response | null> {
    return this.page.goto(`${this.baseUrl}${this.path}/${token}`, options);
  }
}
