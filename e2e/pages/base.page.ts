import { Page, BrowserContext, Response, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page, protected readonly context: BrowserContext, readonly baseUrl: string) {}

  protected abstract readonly path: string;

  get url(): string {
    return this.page.url();
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

  async gotoUrl(url: string, options?: { waitUntil?: 'load' | 'commit' | 'networkidle' }): Promise<Response | null> {
    return this.page.goto(url, options);
  }

  async waitForUrl(
    pattern: string | RegExp,
    options?: { timeout?: number; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' },
  ): Promise<void> {
    await this.page.waitForURL(pattern, options);
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void> {
    await this.page.waitForLoadState(state);
  }

  async clearCookies(): Promise<void> {
    await this.context.clearCookies();
  }

  async addSessionCookie(value: string): Promise<void> {
    await this.context.addCookies([{ name: 'ads_session', value, url: this.baseUrl }]);
  }

  async setScenarioHeader(scenario: string): Promise<void> {
    await this.page.setExtraHTTPHeaders({
      'x-test-scenario': scenario,
    });
  }

  async setScenarioViaRoute(scenario: string): Promise<void> {
    await this.context.route('**/*', async (route) => {
      const headers = route.request().headers();
      headers['x-test-scenario'] = scenario;
      await route.continue({ headers });
    });
  }

  async setExtraHeaders(headers: Record<string, string>): Promise<void> {
    await this.page.setExtraHTTPHeaders(headers);
  }

  async interceptRoute(pattern: string, handler: Parameters<Page['route']>[1]): Promise<void> {
    await this.page.route(pattern, handler);
  }

  async getCookies() {
    return this.context.cookies();
  }

  urlContains(substring: string): void {
    expect(this.page.url()).toContain(substring);
  }

  urlEquals(expected: string): void {
    expect(this.page.url()).toBe(expected);
  }

  urlMatches(pattern: RegExp): void {
    expect(this.page.url()).toMatch(pattern);
  }
}
