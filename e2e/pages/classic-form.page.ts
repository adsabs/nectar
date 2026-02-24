import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class ClassicFormPage extends BasePage {
  protected readonly path = '/classic-form';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async expectVisible(): Promise<void> {
    await this.page.locator('[aria-labelledby="form-title"]').waitFor({ state: 'visible' });
  }
}
