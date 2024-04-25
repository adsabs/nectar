import { Browser, PlaywrightTestArgs } from '@playwright/test';

export const clearLibrary = async (browser: Browser) => {
  const { user1Page, user2Page, done } = await createDualUserContexts(browser);

  await gotoAllLibraries(user1Page);
  await clearAllLibraries(user1Page);

  await gotoAllLibraries(user2Page);
  await clearAllLibraries(user2Page);

  await done();
};

export const clearAllLibraries = async (page: PlaywrightTestArgs['page']) => {
  for (const library of await page.locator('tbody tr').all()) {
    await library.getByTestId('library-action-menu').click();
    await library.getByRole('menuitem', { name: 'Delete Library' }).click();
    await page.getByTestId('confirm-del-lib-btn').click();
  }
};

export const gotoAllLibraries = async (page: PlaywrightTestArgs['page']) =>
  await page.goto('/user/libraries', {
    waitUntil: 'networkidle',
  });

export const addNewLibraryFromDashboard = async (
  page: PlaywrightTestArgs['page'],
  options: {
    name: string;
    public: boolean;
    description: string;
  },
) => {
  await page.getByTestId('add-new-lib-btn').click();
  await page.getByTestId('new-library-name').click();
  await page.getByTestId('new-library-name').fill(options.name);
  await page.getByTestId('new-library-name').press('Tab');
  await page.getByTestId('new-library-desc').fill(options.description);
  await page.getByTestId('new-library-desc').press('Tab');
  if (options.public) {
    await page.getByTestId('add-new-lib-modal').locator('span').nth(1).click();
  }
  await page.getByRole('button', { name: 'Submit' }).click();
};

type LibraryActionModalOptions =
  | {
      createNew: true;
      name: string;
      public: boolean;
      description: string;
    }
  | {
      createNew: false;
      name: string;
    };

const handleLibraryActionModal = async (page: PlaywrightTestArgs['page'], options: LibraryActionModalOptions) => {
  if (options.createNew) {
    await page.getByRole('tab', { name: 'New Library' }).click();
    await page.getByLabel('Enter a name for the new library: *').fill(options.name);
    await page.getByLabel('Description:').fill(options.description);
    if (options.public) {
      await page.getByLabel('Add all paper(s) to Library').locator('span').nth(1).click();
    }
  } else {
    await page.getByTestId('library-selector').click();
    await page.getByRole('cell', { name: options.name }).click();
  }
  await page.getByRole('button', { name: 'Submit' }).click();
};

export const addSelectionToLibrary = async (page: PlaywrightTestArgs['page'], options: LibraryActionModalOptions) => {
  await page.getByRole('button', { name: 'Bulk Actions' }).click();
  await page.getByRole('menuitem', { name: 'Add to Library' }).click();
  await handleLibraryActionModal(page, options);
};

export const addPaperToLibrary = async (page: PlaywrightTestArgs['page'], options: LibraryActionModalOptions) => {
  await page.getByRole('button', { name: 'Add to Library' }).click();
  await handleLibraryActionModal(page, options);
};

export const deleteLibraryFromDashboard = async (
  page: PlaywrightTestArgs['page'],
  options: { id: string; name?: never } | { name: string; id?: never },
) => {
  if (options.id) {
    await page.locator(`#${options.id}`).getByTestId('library-action-menu').click();
  }
  if (options.name) {
    await page.getByTestId(`library-[${options.name}]`).getByTestId('library-action-menu').click();
  }
  await page.getByRole('menuitem', { name: 'Delete Library' }).click();
  await page.getByTestId('confirm-del-lib-btn').click();
};

export const createDualUserContexts = async (browser: Browser) => {
  const user1Context = await browser.newContext({ storageState: 'playwright/.auth/user1.json' });
  const user1Page = await user1Context.newPage();

  const user2Context = await browser.newContext({ storageState: 'playwright/.auth/user2.json' });
  const user2Page = await user2Context.newPage();
  const done = async () => {
    await user1Context.close();
    await user2Context.close();
  };
  return { user1Page, user2Page, done };
};
