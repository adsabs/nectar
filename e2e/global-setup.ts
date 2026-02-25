/**
 * Warms the Next.js dev server compilation cache before tests run.
 *
 * In Docker CI, the first browser request to each page triggers
 * on-demand compilation of both server and client bundles, which can
 * take 30-60s on slow runners — exceeding Playwright action timeouts.
 *
 * This setup launches a throwaway browser, navigates to key pages,
 * and waits for them to fully load. Subsequent test navigations hit
 * the already-compiled bundles and load quickly.
 */
import { chromium } from '@playwright/test';

async function globalSetup() {
  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8000';

  const browser = await chromium.launch({ args: ['--use-gl=egl'] });
  const context = await browser.newContext();
  await context.addCookies([{ name: 'ads_session', value: 'warmup', url: baseUrl }]);
  const page = await context.newPage();
  await page.setExtraHTTPHeaders({ 'x-test-scenario': 'bootstrap-anonymous' });

  const pages = ['/', '/search?p=1&q=test'];

  for (const path of pages) {
    const url = `${baseUrl}${path}`;
    try {
      await page.goto(url, { timeout: 120_000, waitUntil: 'networkidle' });
      console.log(`[warmup] ${url} — loaded`);
    } catch {
      console.warn(`[warmup] ${url} — timed out, continuing`);
    }
  }

  await browser.close();
}

export default globalSetup;
