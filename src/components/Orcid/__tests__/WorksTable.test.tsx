import { expect, test, TestContext } from 'vitest';
import { createServerListenerMocks, render, urls } from '@/test-utils';
import { WorksTable } from '@/components/Orcid';
import { rest } from 'msw';

import { equals } from 'ramda';
import { waitFor } from '@testing-library/dom';
import orcidProfileResponse from '@/mocks/responses/orcid/orcid-profile_full.json';
import { apiHandlerRoute } from '@/mocks/mockHelpers';
import { ApiTargets } from '@/api/models';
import { IADSApiSearchResponse } from '@/api/search/types';

test.skip('triggers call to profile on mount', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  const { findByRole } = render(<WorksTable />, { storePreset: 'orcid-authenticated' });
  await waitFor(() => expect(urls(onRequest)).deep.include('/orcid/0009-0001-9552-8355/orcid-profile/full'));
  await findByRole('table');
});

test.skip('renders without issue', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  server.use(
    rest.get(apiHandlerRoute(ApiTargets.ORCID_PROFILE), (req, res, ctx) => res(ctx.json(orcidProfileResponse))),
  );
  const { user, findByTestId, findByRole, findAllByRole } = render(<WorksTable />, {
    storePreset: 'orcid-authenticated',
  });

  const checkRows = async (numExpected: number) => {
    const rows = await findAllByRole('row');

    // includes the header, so always N + 1
    expect(rows.length - 1).toBe(numExpected);
  };

  const checkValue = async (valueExpected: string) => {
    const hiddenInput = await findByTestId('orcid-works-filter');
    expect(hiddenInput).toHaveValue(valueExpected);
  };

  await waitFor(() => expect(urls(onRequest)).deep.include('/orcid/0009-0001-9552-8355/orcid-profile/full'));
  await findByRole('table');
  const filter = await findByRole('combobox', { name: 'Filter' });
  filter.focus();
  await user.type(filter, '{arrowdown}{enter}');
  await checkValue('in_orcid');
  await checkRows(8);

  filter.focus();
  await user.type(filter, '{arrowdown}{enter}');
  await findByRole('table');
  await checkValue('not_in_orcid');
  await checkRows(1);

  // no results
  filter.focus();
  await user.type(filter, '{arrowdown}{enter}');
  await findByTestId('orcid-works-table-no-results');
  await checkValue('not_in_scix');

  filter.focus();
  await user.type(filter, '{arrowdown}{enter}');
  await findByRole('table');
  await checkValue('pending');
  await checkRows(2);

  filter.focus();
  await user.type(filter, '{arrowdown}{enter}');
  await findByRole('table');
  await checkValue('verified');
  await checkRows(2);
});

test.skip('Confirm proper requests are made and data is right', async ({ server }: TestContext) => {
  const { onRequest } = createServerListenerMocks(server);
  server.use(rest.get(`*${ApiTargets.ORCID_PROFILE}`, (req, res, ctx) => res(ctx.json(orcidProfileResponse))));
  server.use(
    rest.get<IADSApiSearchResponse>(apiHandlerRoute(ApiTargets.SEARCH), (req, res, ctx) =>
      res(
        ctx.json({
          response: {
            docs: [
              { title: ['new work'], pubdate: '2020/01', identifier: ['foo', 'bar', 'baz'] },

              // this one exists already on profile
              {
                title: ['already on profile'],
                pubdate: '2021/04',
                identifier: ['2022BAAS...54b.022A'],
              },
            ],
            numFound: 1,
          },
        }),
      ),
    ),
  );
  const { findByRole, findAllByRole } = render(<WorksTable />, {
    storePreset: 'orcid-authenticated',
  });

  const table = (await findByRole('table')) as HTMLTableElement;
  const rows = await findAllByRole('row');

  // include the header row
  expect(rows).toHaveLength(11);
  expect(table.rows[10].cells[0]).toHaveTextContent('new work');
  expect(table.rows[10].cells[1]).toHaveTextContent('Provided by publisher');
  expect(table.rows[10].cells[3]).toHaveTextContent('Unclaimed');

  // should make a search AND a call to profile and the result should be a merge
  expect(urls(onRequest).filter(equals('/search/query'))).toHaveLength(1);
  expect(urls(onRequest).filter(equals('/orcid/0009-0001-9552-8355/orcid-profile/full'))).toHaveLength(1);
});
