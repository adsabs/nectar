import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  protected readonly path = '/';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async search(query: string): Promise<void> {
    // Set the input value and submit in a single synchronous evaluate.
    // The search input is a Chakra Combobox with controlled state — using
    // Playwright's fill() sets the DOM value, but React re-renders and
    // clears it before a separate submit call can run. By setting the
    // value and calling form.submit() in one JS execution frame, React
    // cannot re-render between them.
    await this.page.evaluate((q) => {
      const input = document.querySelector('input[name="q"]') as HTMLInputElement;
      input.value = q;
      const form = document.querySelector('form[action="/search"]') as HTMLFormElement;
      form.submit();
    }, query);
  }

  async expectVisible(): Promise<void> {
    await this.page.getByPlaceholder('all search terms').waitFor({ state: 'visible' });
  }
}
