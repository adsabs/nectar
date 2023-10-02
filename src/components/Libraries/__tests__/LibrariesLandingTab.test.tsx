import { apiHandlerRoute, createServerListenerMocks, fireEvent, render } from '@test-utils';
import { expect, test, TestContext } from 'vitest';
import allLibsResponse from '@mocks/responses/library/all-libraries.json';
import { rest } from 'msw';
import { ApiTargets } from '@api';
import { LibraryListTable } from '../LibraryListTable';
import { LibrariesLandingPane } from '../LibrariesLandingPane';

test('renders without issue', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  server.use(rest.get(apiHandlerRoute(ApiTargets.LIBRARIES), (req, res, ctx) => res(ctx.json(allLibsResponse))));

  const { user, findByTestId, findByRole, findAllByRole } = render(<LibrariesLandingPane />);
  const table = await findByTestId('libraries-table');
  expect(table.querySelectorAll('tr').length).toBe(16); // incl. header

  const pageSizeSelector = await findByTestId('page-size-selector');
  expect(pageSizeSelector.querySelectorAll('option')[0].selected).toBeTruthy();

  const paginationString = await findByTestId('pagination-string');
  expect(paginationString.textContent).toEqual('Showing 1 to 10 of 15 results');

  fireEvent.change(pageSizeSelector, { target: { value: 25 } });
  expect((await findByTestId('pagination-string')).textContent).toEqual('Showing 1 to 15 of 15 results');
  expect((await findByTestId('libraries-table')).querySelectorAll('tr').length).toBe(16);
});
