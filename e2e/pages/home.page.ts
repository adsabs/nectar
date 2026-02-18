import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  protected readonly path = '/';

  private readonly searchInput = '[data-testid="search-input"]';
  private readonly searchSubmit = '[data-testid="search-submit"]';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async search(query: string): Promise<void> {
    await this.page.fill(this.searchInput, query);
    await this.page.click(this.searchSubmit);
  }
}
