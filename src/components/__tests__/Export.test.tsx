/* eslint-disable @typescript-eslint/no-unsafe-call */
import Adsapi, { IADSApiSearchResponse } from '@api';
import { IExportApiParams, IExportApiResponse } from '@api/lib/export';
import { ApiTargets } from '@api/lib/models';
import { IUseExportProps, IUseExportReturns, useExportMachine } from '@components/Export/hook';
import * as fixtures from '@components/__mocks__/exportMock';
import { mockSession } from '@components/__mocks__/session';
import { ApiProvider } from '@providers/api';
import { AppProvider } from '@store';
import { IAppState } from '@store/types';
import { act, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import MockAdapter from 'axios-mock-adapter';
import { FC } from 'react';
import { Default as Export } from '../__stories__/Export.stories';

// mock the router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: '',
    asPath: '',
    replace: () => undefined,
  }),
}));

const createWrapper =
  ({ api, store }: { api?: Adsapi; store?: Partial<IAppState> } = {}): FC =>
  ({ children }) =>
    (
      <AppProvider session={mockSession} initialStore={store}>
        <ApiProvider overrideInstance={api}>{children}</ApiProvider>
      </AppProvider>
    );

test('Export renders without crashing', () => {
  render(<Export loadInitially={false} />, { wrapper: createWrapper() });
});

test('Export machine calls to /search and /export by default', async () => {
  const query = fixtures.mockQuery;
  const api = new Adsapi();

  const searchMock = new MockAdapter(api.search.getAxiosInstance());
  const exportMock = new MockAdapter(api.export.getAxiosInstance());

  searchMock.onGet().reply<IADSApiSearchResponse>(() => fixtures.queryBasedSearchResponse);
  exportMock.onPost().reply<IExportApiResponse>((config) => {
    const bibcodes = (JSON.parse(config.data) as IExportApiParams).bibcode;
    return fixtures.getResponse(bibcodes.length);
  });

  const { result, waitForNextUpdate } = renderHook<IUseExportProps, IUseExportReturns>(
    () =>
      useExportMachine({
        initialFormat: 'bibtex',
        initialText: '',
        initialBibcodes: [],
        singleMode: false,
        loadInitially: false,
      }),
    { wrapper: createWrapper({ api, store: { query } }) },
  );

  // check initial state
  expect(result.current.state).toEqual({
    text: '',
    format: 'bibtex',
    limit: 0,
    totalRecords: 0,
    customFormat: '',
    loading: false,
  });
  act(() => result.current.handlers.onSubmit());
  await waitForNextUpdate();

  // state updated after network calls
  expect(result.current.state).toEqual({
    ...result.current.state,
    text: fixtures.getResponse(4)[1].export,
    limit: 4,
    totalRecords: 4,
  });

  // check that search is called
  expect(searchMock.history.get).toHaveLength(1);
  expect(searchMock.history.get[0].params).toEqual({
    q: 'bibcode:(2020ASPC..527..505B OR 2020AAS...23528705A OR 2019ASPC..523..353B OR 2019AAS...23338108A)',
    sort: 'date desc',
    fl: 'id,bibcode',
    rows: 500,
    start: 0,
  });

  // check export endpoint is called
  expect(exportMock.history.post).toHaveLength(1);
  expect(exportMock.history.post[0].url).toEqual(`${ApiTargets.EXPORT}/bibtex`);
  expect(exportMock.history.post[0].data).toEqual(
    '{"bibcode":["2020AAS...23528705A","2020ASPC..527..505B","2019ASPC..523..353B","2019AAS...23338108A"],"format":[""]}',
  );
});
