import { BrowserContext, expect, Locator, Page, test } from '@playwright/test';

import {
  SEARCH_RESULT_TITLE_PREFIX,
  seedNumPerPage,
  stubSearchResults,
  suppressOnboardingTours,
} from '../../fixtures/search-results';

const ROW_SELECTOR = '#results article';
const OVERLAY_ROW_COUNT = 10;
const FULL_ROW_COUNT = 500;
const PROBE_ROW_INDEX = 2;
const MD_BREAKPOINT_PX = 768;

const OVERLAY_TIMEOUT_MS = 90_000;
const FULL_LIST_TIMEOUT_MS = 240_000;

const VIEWPORTS = [
  { label: 'desktop', width: 1440, height: 900 },
  { label: 'mobile', width: 390, height: 844 },
] as const;

const MENU_BUTTON_NAMES = ['Full text sources', 'References and citations', 'Data products', 'share options'] as const;

interface OverlayProbe {
  insideRow: boolean;
  clippingAncestor: string | null;
  ignoresPointerEvents: boolean;
  hitTestsToSelf: boolean;
  hitTarget: string;
  box: { x: number; y: number; width: number; height: number };
}

const probeOverlay = (page: Page, overlayId: string, rowIndex: number): Promise<OverlayProbe> =>
  page.evaluate(
    ([id, selector, index]) => {
      const overlay = document.getElementById(id as string);
      if (overlay === null) {
        throw new Error(`overlay #${String(id)} is not in the document`);
      }
      const row = document.querySelectorAll(selector as string)[index as number];
      if (row === undefined) {
        throw new Error(`no row at index ${String(index)}`);
      }

      const describe = (el: Element): string => `${el.tagName}#${el.id}.${String(el.className)}`.slice(0, 120);

      const findClippingAncestor = (): Element | null => {
        for (let node = overlay.parentElement; node !== null; node = node.parentElement) {
          const style = window.getComputedStyle(node);
          const clipsPaint =
            style.contain.includes('paint') ||
            style.contain.includes('strict') ||
            style.contain.includes('content') ||
            style.contentVisibility === 'auto' ||
            style.contentVisibility === 'hidden';
          if (clipsPaint) {
            return node;
          }
        }
        return null;
      };

      const rect = overlay.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width / 2);
      const y = Math.round(rect.bottom - 2);
      const topMost = document.elementFromPoint(x, y);
      const clipper = findClippingAncestor();

      return {
        insideRow: row.contains(overlay),
        clippingAncestor: clipper === null ? null : describe(clipper),
        ignoresPointerEvents: window.getComputedStyle(overlay).pointerEvents === 'none',
        hitTestsToSelf: topMost !== null && (overlay === topMost || overlay.contains(topMost)),
        hitTarget: topMost === null ? 'none' : `${topMost.tagName}.${String(topMost.className)}`.slice(0, 120),
        box: { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
      };
    },
    [overlayId, ROW_SELECTOR, rowIndex] as const,
  );

const expectUnclippedOverlay = (probe: OverlayProbe, page: Page, label: string): void => {
  const viewport = page.viewportSize();
  if (viewport === null) {
    throw new Error('no viewport size');
  }

  expect(probe.insideRow, `${label} must be portaled out of its result row`).toBe(false);
  expect(
    probe.clippingAncestor,
    `${label} has a paint-containing ancestor that will clip it: ${String(probe.clippingAncestor)}`,
  ).toBeNull();

  expect(probe.box.width, `${label} has no width`).toBeGreaterThan(0);
  expect(probe.box.height, `${label} has no height`).toBeGreaterThan(0);
  expect(probe.box.x, `${label} overflows the left edge`).toBeGreaterThanOrEqual(-1);
  expect(probe.box.y, `${label} overflows the top edge`).toBeGreaterThanOrEqual(-1);
  expect(probe.box.x + probe.box.width, `${label} overflows the right edge`).toBeLessThanOrEqual(viewport.width + 1);
  expect(probe.box.y + probe.box.height, `${label} overflows the bottom edge`).toBeLessThanOrEqual(viewport.height + 1);

  if (!probe.ignoresPointerEvents) {
    expect(probe.hitTestsToSelf, `${label} is clipped — its own bottom edge hit-tests to ${probe.hitTarget}`).toBe(
      true,
    );
  }
};

const gotoStubbedSearch = async (
  page: Page,
  context: BrowserContext,
  viewport: { width: number; height: number },
  rowCount: number,
): Promise<Locator> => {
  await page.setViewportSize(viewport);
  await suppressOnboardingTours(context);
  await seedNumPerPage(context, rowCount);
  await stubSearchResults(page, rowCount);

  await page.goto(`/search?q=${encodeURIComponent('synthetic')}`, { waitUntil: 'commit' });
  await page
    .locator(ROW_SELECTOR)
    .nth(rowCount - 1)
    .waitFor({ state: 'attached' });

  return page.locator(ROW_SELECTOR).nth(PROBE_ROW_INDEX);
};

for (const viewport of VIEWPORTS) {
  test.describe(`result item overlays — ${viewport.label} (${viewport.width}x${viewport.height})`, () => {
    for (const buttonName of MENU_BUTTON_NAMES) {
      test(`"${buttonName}" menu opens unclipped and outside its row`, async ({ page, context }) => {
        test.setTimeout(OVERLAY_TIMEOUT_MS);
        const row = await gotoStubbedSearch(page, context, viewport, OVERLAY_ROW_COUNT);
        await row.scrollIntoViewIfNeeded();

        const button = row.getByRole('button', { name: buttonName, exact: true });
        await button.click();

        const overlayId = await button.getAttribute('aria-controls');
        expect(overlayId, `${buttonName} button has no aria-controls`).toBeTruthy();

        const menu = page.locator(`[id="${overlayId}"]`);
        await expect(menu).toBeVisible();

        expectUnclippedOverlay(
          await probeOverlay(page, overlayId as string, PROBE_ROW_INDEX),
          page,
          `${buttonName} menu`,
        );
      });
    }

    test('portaled share menu still closes on an outside click', async ({ page, context }) => {
      test.setTimeout(OVERLAY_TIMEOUT_MS);
      const row = await gotoStubbedSearch(page, context, viewport, OVERLAY_ROW_COUNT);
      await row.scrollIntoViewIfNeeded();

      const button = row.getByRole('button', { name: 'share options', exact: true });
      await button.click();

      const overlayId = await button.getAttribute('aria-controls');
      const menu = page.locator(`[id="${overlayId}"]`);
      await expect(menu).toBeVisible();

      await row.getByText('Journal of Synthetic Astrophysics', { exact: false }).click();

      await expect(menu).not.toBeVisible();
    });

    test('publication tooltip opens unclipped and outside its row', async ({ page, context }) => {
      test.setTimeout(OVERLAY_TIMEOUT_MS);
      const row = await gotoStubbedSearch(page, context, viewport, OVERLAY_ROW_COUNT);
      await row.scrollIntoViewIfNeeded();

      await row.getByText('Journal of Synthetic Astrophysics', { exact: false }).hover();

      const tooltip = page.getByRole('tooltip');
      await expect(tooltip).toBeVisible();

      const tooltipId = await tooltip.getAttribute('id');
      expect(tooltipId, 'tooltip has no id to anchor the probe on').toBeTruthy();

      expectUnclippedOverlay(
        await probeOverlay(page, tooltipId as string, PROBE_ROW_INDEX),
        page,
        'publication tooltip',
      );
    });

    test('result rows carry containment with the measured intrinsic size', async ({ page, context }) => {
      test.setTimeout(OVERLAY_TIMEOUT_MS);
      const row = await gotoStubbedSearch(page, context, viewport, OVERLAY_ROW_COUNT);

      const onScreen = await row.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          contentVisibility: style.contentVisibility,
          containIntrinsicSize: style.containIntrinsicSize,
        };
      });

      expect(onScreen.contentVisibility, 'row must declare content-visibility: auto').toBe('auto');
      expect(onScreen.containIntrinsicSize, 'intrinsic size must match the measured row height').toBe(
        viewport.width >= MD_BREAKPOINT_PX ? 'auto 144px' : 'auto 327px',
      );

      await page.emulateMedia({ media: 'print' });
      const printed = await row.evaluate((el) => window.getComputedStyle(el).contentVisibility);
      await page.emulateMedia({ media: 'screen' });

      expect(printed, 'containment must be off in print so every row is printable').toBe('visible');
    });

    test(`all ${FULL_ROW_COUNT} rows stay in the DOM`, async ({ page, context }) => {
      test.setTimeout(FULL_LIST_TIMEOUT_MS);
      await gotoStubbedSearch(page, context, viewport, FULL_ROW_COUNT);

      await expect(page.locator(ROW_SELECTOR)).toHaveCount(FULL_ROW_COUNT);

      const lastRow = page.locator(ROW_SELECTOR).nth(FULL_ROW_COUNT - 1);
      await expect(lastRow).toContainText(`Synthetic result ${FULL_ROW_COUNT}`);
    });

    test('offscreen rows stay reachable to select-all, find-in-page and print', async ({ page, context }) => {
      test.setTimeout(FULL_LIST_TIMEOUT_MS);
      await gotoStubbedSearch(page, context, viewport, FULL_ROW_COUNT);

      const needle = `${SEARCH_RESULT_TITLE_PREFIX} ${FULL_ROW_COUNT}:`;
      const lastRow = page.locator(ROW_SELECTOR).nth(FULL_ROW_COUNT - 1);

      const titleIsRendered = (el: SVGElement | HTMLElement) => {
        const title = el.querySelector('.article-title');
        if (title === null) {
          throw new Error('row has no title element');
        }
        const check = (
          title as Element & {
            checkVisibility?: (options: { contentVisibilityAuto: boolean }) => boolean;
          }
        ).checkVisibility;
        if (typeof check !== 'function') {
          throw new Error('checkVisibility({ contentVisibilityAuto }) is unavailable');
        }
        return check.call(title, { contentVisibilityAuto: true });
      };

      const renderedOnScreen = await lastRow.evaluate(titleIsRendered);

      await page.emulateMedia({ media: 'print' });
      const renderedInPrint = await lastRow.evaluate(titleIsRendered);
      await page.emulateMedia({ media: 'screen' });

      expect(renderedOnScreen, 'a row far below the fold must have its rendering skipped').toBe(false);
      expect(renderedInPrint, 'print must render the contents of an offscreen row').toBe(true);

      const selectedText = await page.evaluate(() => {
        const selection = window.getSelection();
        if (selection === null) {
          return '';
        }
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(document.body);
        selection.addRange(range);
        return selection.toString();
      });
      expect(selectedText, 'select-all must reach the last offscreen row').toContain(needle);

      const found = await page.evaluate((text) => {
        const finder = (window as unknown as { find?: (needle: string) => boolean }).find;
        window.getSelection()?.removeAllRanges();
        window.scrollTo(0, 0);
        return typeof finder === 'function' ? finder.call(window, text) : null;
      }, needle);
      expect(found, 'window.find is unavailable, so find-in-page cannot be verified here').not.toBeNull();
      expect(found, 'find-in-page must reach the last offscreen row').toBe(true);

      await page.evaluate(() => window.scrollTo(0, 0));
    });

    test.describe('visual regression', () => {
      test.skip(
        process.env.E2E_VISUAL !== '1',
        'Baselines are pinned to the e2e/docker-compose.yml container, which sets E2E_VISUAL=1. ' +
          'Font and anti-aliasing differences make them unusable on a host.',
      );

      test('result row renders unchanged with the menus closed', async ({ page, context }) => {
        test.setTimeout(OVERLAY_TIMEOUT_MS);
        const row = await gotoStubbedSearch(page, context, viewport, OVERLAY_ROW_COUNT);
        await row.scrollIntoViewIfNeeded();

        await expect(row).toHaveScreenshot(`result-row-${viewport.label}.png`, {
          maxDiffPixelRatio: 0.01,
        });
      });

      test('result row renders unchanged with a menu open', async ({ page, context }) => {
        test.setTimeout(OVERLAY_TIMEOUT_MS);
        const row = await gotoStubbedSearch(page, context, viewport, OVERLAY_ROW_COUNT);
        await row.scrollIntoViewIfNeeded();

        const button = row.getByRole('button', { name: 'Full text sources', exact: true });
        await button.click();

        const overlayId = await button.getAttribute('aria-controls');
        const menu = page.locator(`[id="${overlayId}"]`);
        await expect(menu).toBeVisible();

        const menuBox = await menu.boundingBox();
        if (menuBox === null) {
          throw new Error('open menu has no bounding box');
        }

        expect(menuBox.y, 'open menu overflows the top of the captured viewport').toBeGreaterThanOrEqual(0);
        expect(
          menuBox.y + menuBox.height,
          'open menu overflows the bottom of the captured viewport',
        ).toBeLessThanOrEqual(viewport.height);

        await expect(page).toHaveScreenshot(`result-row-menu-${viewport.label}.png`, {
          maxDiffPixelRatio: 0.01,
        });
      });
    });
  });
}
