import { expect, test } from '@playwright/test';
import { addNewLibraryFromDashboard, clearLibrary, createDualUserContexts, gotoAllLibraries } from './libraries.utils';

test.describe.configure({
  mode: 'parallel',
});

test.describe('user library work flow', () => {
  test.beforeEach(async ({ browser }) => {
    await clearLibrary(browser);
  });

  test('user can add, update and delete a library from the dashboard', async ({ page }) => {
    await gotoAllLibraries(page);

    // confirm no libraries are found
    await expect(page.locator('#main-content').getByRole('alert')).toHaveText('No libraries found');

    // add the new library
    await addNewLibraryFromDashboard(page, {
      name: 'test library',
      public: false,
      description: 'test description',
    });

    // confirm the library is added
    await expect(page.getByRole('cell', { name: 'test library test description' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'private' })).toBeVisible();

    // update library metadata
    await page.getByTestId('library-action-menu').click();
    await page.getByRole('menuitem', { name: 'Settings' }).click();
    await page.getByTestId('library-name-input').click();
    await page.getByTestId('library-name-input').fill('test library updated');
    await page.getByTestId('library-desc-input').click();
    await page.getByTestId('library-desc-input').fill('test description updated');
    await page.getByTestId('library-public-switch').locator('span').first().click();
    await page.getByRole('button', { name: 'Save' }).click();

    // confirm the library is updated
    await gotoAllLibraries(page);
    await expect.soft(page.getByRole('cell', { name: 'public' })).toBeVisible();
  });

  test('user can view a public library they do not own', async ({ browser }) => {
    const { user1Page, user2Page, done } = await createDualUserContexts(browser);
    await gotoAllLibraries(user2Page);

    // confirm no libraries are found
    await expect(user2Page.locator('#main-content').getByRole('alert')).toHaveText('No libraries found');

    // add the new library
    await addNewLibraryFromDashboard(user2Page, {
      name: 'test library',
      public: false,
      description: 'test description',
    });

    // fetch and goto the public url (currently not accessible)
    await user2Page.getByTestId('library-action-menu').click();
    await user2Page.getByRole('menuitem', { name: 'Settings' }).click();
    const publicUrl = await user2Page.getByRole('link', { name: 'View as public library' }).getAttribute('href');
    await user1Page.goto(publicUrl);

    // confirm the library is not accessible
    await expect(user1Page.locator('#main-content').getByRole('alert')).toHaveText(
      'ErrorYou do not have the correct permissions or the library does not exist.',
    );

    // update the library to public
    await user2Page.getByTestId('library-public-switch').locator('span').first().click();
    await user2Page.getByRole('button', { name: 'Save' }).click();

    // fetch and goto the public url (currently accessible)
    await user1Page.goto(publicUrl);

    // confirm the library is accessible
    await expect(user1Page.getByTestId('lib-title')).toHaveText('test library');

    // cleanup
    await user2Page.getByRole('button', { name: 'Delete Library' }).click();
    await user2Page.getByRole('button', { name: 'Cancel' }).click();
    await done();
  });
});
