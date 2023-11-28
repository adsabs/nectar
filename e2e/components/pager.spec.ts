import { test } from '@playwright/test';

test.use({
  baseURL: 'http://localhost:8001/iframe.html',
});

test.describe.configure({
  mode: 'parallel',
});

test('should render the pager', async ({ page }) => {
  await page.goto('?args=&id=pager--default&viewMode=story');
  await page.waitForSelector('#storybook-root [role="tablist"]');
});

test('should render the pager with the correct number of pages', async ({ page }) => {
  await page.goto('?args=&id=pager--default&viewMode=story');
  const pager = await page.waitForSelector('#storybook-root [role="tablist"]');
  const pages = await pager.$$('[role="tab"]');
  test.expect(pages.length).toBe(6);
});

test('clicking on next should advance the page', async ({ page }) => {
  await page.goto('?args=&id=pager--default&viewMode=story');
  await page.waitForSelector('#storybook-root [role="tablist"]');
  const next = page.getByLabel('goto next page');
  await next.click();
  const activePage = page.getByRole('tabpanel');
  test.expect(await activePage.textContent()).toBe('Page 2');
  const activeTab = page.getByRole('tab', { selected: true });
  await test.expect(activeTab).toHaveText('●');
  await test.expect(activeTab).toHaveAttribute('data-index', '1');
});

test('clicking on previous should go back a page, or cycle around', async ({ page }) => {
  await page.goto('?args=&id=pager--default&viewMode=story');
  await page.waitForSelector('#storybook-root [role="tablist"]');
  const previous = page.getByLabel('goto previous page');
  await previous.click();
  const activePage = page.getByRole('tabpanel');
  test.expect(await activePage.textContent()).toBe('Page 6');
  const activeTab = page.getByRole('tab', { selected: true });
  await test.expect(activeTab).toHaveText('●');
  await test.expect(activeTab).toHaveAttribute('data-index', '5');
});

test('should cycle through pages correctly in both directions', async ({ page }) => {
  await page.goto('?args=&id=pager--default&viewMode=story');
  await page.waitForSelector('#storybook-root [role="tablist"]');

  const check = async (i: number) => {
    const activePage = page.getByRole('tabpanel');
    test.expect(await activePage.textContent()).toBe(`Page ${i + 1}`);
    const activeTab = page.getByRole('tab', { selected: true });
    await test.expect(activeTab).toHaveText('●');
    await test.expect(activeTab).toHaveAttribute('data-index', `${i}`);
  };

  for (let i = 0; i < 5; i++) {
    await check(i);
    const next = page.getByLabel('goto next page');
    await next.click();
  }
  for (let i = 5; i >= 0; i--) {
    await check(i);
    const previous = page.getByLabel('goto previous page');
    await previous.click();
  }
});

test('dynamic page content works properly', async ({ page }) => {
  await page.goto('?args=&id=pager--with-dynamic-content&viewMode=story');
  await page.waitForSelector('#storybook-root [role="tablist"]');
  const text = await page.getByRole('tabpanel').textContent();
  test.expect(JSON.parse(text)).toStrictEqual({ title: 'First', page: 0 });
  await page.getByLabel('goto next page').click();
  const text2 = await page.getByRole('tabpanel').textContent();
  test.expect(JSON.parse(text2)).toStrictEqual({ title: 'Second', page: 1 });
});
