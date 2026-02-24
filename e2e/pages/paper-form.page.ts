import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class PaperFormPage extends BasePage {
  protected readonly path = '/paper-form';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async expectVisible(): Promise<void> {
    await this.page.getByRole('heading', { name: /journal search/i }).waitFor({ state: 'visible' });
  }
}
