import { Page, BrowserContext, Response, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class SearchPage extends BasePage {
  protected readonly path = '/search';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async search(query: string): Promise<void> {
    await this.page.evaluate((q) => {
      const input = document.querySelector('input[name="q"]') as HTMLInputElement;
      input.value = q;
      const form = document.querySelector('form[action="/search"]') as HTMLFormElement;
      form.submit();
    }, query);
  }

  async gotoAndExpect(options?: { waitUntil?: 'load' | 'commit' | 'networkidle' }): Promise<Response> {
    const response = await this.goto(options);
    expect(response).not.toBeNull();
    return response!;
  }

  async expectVisible(): Promise<void> {
    await this.page.getByPlaceholder('all search terms').waitFor({ state: 'visible' });
  }
}
