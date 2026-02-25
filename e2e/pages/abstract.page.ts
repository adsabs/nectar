import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './base.page';

export class AbstractPage extends BasePage {
  protected readonly path = '/abs';

  constructor(page: Page, context: BrowserContext, baseUrl: string) {
    super(page, context, baseUrl);
  }

  async gotoAbstract(bibcode: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}${this.path}/${bibcode}/abstract`);
  }

  async gotoSubpage(bibcode: string, subpage: string): Promise<void> {
    await this.page.goto(`${this.baseUrl}${this.path}/${bibcode}/${subpage}`);
  }

  async expectVisible(): Promise<void> {
    await this.page.locator('article[aria-labelledby="title"]').waitFor({ state: 'visible' });
  }

  async expectNavMenu(): Promise<void> {
    await this.page.getByRole('navigation', { name: 'sidebar' }).waitFor({ state: 'visible' });
  }

  async clickNavTab(tabName: string): Promise<void> {
    await this.page
      .getByRole('navigation', { name: 'sidebar' })
      .getByRole('link', { name: new RegExp(tabName) })
      .click();
  }

  async expectSubviewTitle(text: string | RegExp): Promise<void> {
    await this.page.locator('#abstract-subview-title').getByText(text).waitFor({ state: 'visible' });
  }
}
