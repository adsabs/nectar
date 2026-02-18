import { Page, BrowserContext, Response, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class SearchPage extends BasePage {
  protected readonly path = '/search';

  private readonly searchInput = '[data-testid="search-input"]';
  private readonly searchSubmit = '[data-testid="search-submit"]';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async search(query: string): Promise<void> {
    await this.page.fill(this.searchInput, query);
    await this.page.click(this.searchSubmit);
  }

  async gotoAndExpect(options?: { waitUntil?: 'load' | 'commit' | 'networkidle' }): Promise<Response> {
    const response = await this.goto(options);
    expect(response).not.toBeNull();
    return response!;
  }
}
