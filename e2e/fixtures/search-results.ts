import { BrowserContext, Page } from '@playwright/test';

import { buildSearchResponse, EMPTY_SEARCH_RESPONSE } from '../../e2e-stub/search-docs';

export const APP_STORAGE_KEY = 'nectar-app-state';
export const SEARCH_RESULT_TITLE_PREFIX = 'Synthetic result';

const isSearchQueryUrl = (url: URL): boolean => url.pathname.endsWith('/search/query');

export const stubSearchResults = async (page: Page, count: number): Promise<void> => {
  await page.route(isSearchQueryUrl, async (route) => {
    const url = new URL(route.request().url());
    const isFacetRequest = [...url.searchParams.keys()].some((key) => key.startsWith('facet') || key === 'json.facet');

    if (isFacetRequest) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(EMPTY_SEARCH_RESPONSE),
      });
      return;
    }

    const requested = Number.parseInt(url.searchParams.get('rows') ?? '', 10);
    const start = Number.parseInt(url.searchParams.get('start') ?? '', 10);
    const rows = Number.isInteger(requested) ? Math.min(Math.max(requested, 0), count) : count;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildSearchResponse(rows, Number.isInteger(start) ? start : 0)),
    });
  });
};

const SEEN_TOUR_KEYS = ['seen-landing-tour', 'seen-results-tour', 'seen-abstract-tour'];

export const suppressOnboardingTours = async (context: BrowserContext): Promise<void> => {
  await context.addInitScript((keys) => {
    for (const key of keys as string[]) {
      window.localStorage.setItem(key, 'true');
    }
  }, SEEN_TOUR_KEYS);
};

export const seedNumPerPage = async (context: BrowserContext, numPerPage: number): Promise<void> => {
  await context.addInitScript(
    ([storageKey, rows]) => {
      window.localStorage.setItem(
        storageKey as string,
        JSON.stringify({ state: { numPerPage: rows as number }, version: 0 }),
      );
    },
    [APP_STORAGE_KEY, numPerPage] as const,
  );
};
