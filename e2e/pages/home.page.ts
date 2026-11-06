import { Page, BrowserContext, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  protected readonly path = '/';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  get searchInput(): Locator {
    return this.page.getByTestId('search-input');
  }

  get searchSubmit(): Locator {
    return this.page.getByTestId('search-submit');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchSubmit.click();
  }
}
