import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class FeedbackPage extends BasePage {
  protected readonly path = '/feedback/general';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async gotoFeedbackType(type: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}/feedback/${type}`);
  }

  async expectVisible(): Promise<void> {
    await this.page.locator('main').waitFor({ state: 'visible' });
  }
}
