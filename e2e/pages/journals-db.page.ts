import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class JournalsDbPage extends BasePage {
  protected readonly path = '/journalsdb';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async expectVisible(): Promise<void> {
    await this.page.getByRole('heading', { name: /journals database/i }).waitFor({ state: 'visible' });
  }
}
