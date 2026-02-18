import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class SettingsPage extends BasePage {
  protected readonly path = '/user/settings';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }
}
