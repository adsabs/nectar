import { Page, BrowserContext, Response } from '@playwright/test';

const headersByPage = new WeakMap<Page, Record<string, string>>();

export abstract class BasePage {
  constructor(protected readonly page: Page, protected readonly context: BrowserContext, readonly baseUrl: string) {}

  protected abstract readonly path: string;

  protected async mergeExtraHeaders(headers: Record<string, string>): Promise<void> {
    const extraHeaders = headersByPage.get(this.page) ?? {};
    Object.assign(extraHeaders, headers);
    headersByPage.set(this.page, extraHeaders);
    await this.page.setExtraHTTPHeaders(extraHeaders);
  }

  buildUrl(params?: string): string {
    const base = `${this.baseUrl}${this.path}`;
    if (!params) {
      return base;
    }
    const url = new URL(base);
    const extra = new URLSearchParams(params.replace(/^\?/, ''));
    extra.forEach((value, key) => url.searchParams.set(key, value));
    return url.toString();
  }

  async goto(options?: { waitUntil?: 'load' | 'commit' | 'networkidle' }): Promise<Response | null> {
    return this.page.goto(`${this.baseUrl}${this.path}`, options);
  }

  async gotoWithParams(
    params: string,
    options?: { waitUntil?: 'load' | 'commit' | 'networkidle' },
  ): Promise<Response | null> {
    return this.page.goto(this.buildUrl(params), options);
  }

  async clearCookies(): Promise<void> {
    await this.context.clearCookies();
  }

  async addSessionCookie(value: string): Promise<void> {
    await this.context.addCookies([{ name: 'ads_session', value, url: this.baseUrl }]);
  }

  async setScenarioHeader(scenario: string): Promise<void> {
    await this.mergeExtraHeaders({ 'x-test-scenario': scenario });
  }

  async setScenarioViaRoute(scenario: string): Promise<void> {
    await this.context.route('**/*', async (route) => {
      const headers = route.request().headers();
      headers['x-test-scenario'] = scenario;
      await route.continue({ headers });
    });
  }

  async getCookies() {
    return this.context.cookies();
  }
}
