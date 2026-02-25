import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class NotificationsPage extends BasePage {
  protected readonly path = '/user/notifications';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async expectVisible(): Promise<void> {
    await this.page.getByRole('heading', { name: /email notifications/i }).waitFor({ state: 'visible' });
  }
}
