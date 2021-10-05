import Adsapi, { IADSApiSearchResponse } from '@api';
import { IExportApiParams, IExportApiResponse } from '@api/lib/export';
import * as fixtures from '@components/__mocks__/exportMock';
import { mockSession } from '@components/__mocks__/session';
import { ApiProvider } from '@providers/api';
import { AppProvider } from '@store';
import { Meta, Story } from '@storybook/react';
import MockAdapter from 'axios-mock-adapter';
import React from 'react';
import { ToastContainer } from 'react-toastify';
import { Export, IExportProps } from '../Export';

const api = new Adsapi();
const exportMock = new MockAdapter(api.export.getAxiosInstance());
const searchMock = new MockAdapter(api.search.getAxiosInstance());

exportMock.onPost().reply<IExportApiResponse>((config) => {
  const { bibcode } = JSON.parse(config.data) as IExportApiParams;
  return new Promise((resolve) => setTimeout(resolve, 1000, fixtures.getResponse(bibcode.length)));
});
searchMock
  .onGet()
  .reply<IADSApiSearchResponse>(
    () => new Promise((resolve) => setTimeout(resolve, 1000, fixtures.queryBasedSearchResponse)),
  );

const meta: Meta<IExportProps> = {
  title: 'Export',
  component: Export,
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    (story): React.ReactElement => (
      <AppProvider session={mockSession} initialStore={{ query: fixtures.mockQuery }}>
        <ApiProvider overrideInstance={api}>
          <ToastContainer />
          {story()}
        </ApiProvider>
      </AppProvider>
    ),
  ],
};

export default meta;

const Template: Story<IExportProps> = (args) => <Export {...args} />;

export const Default = Template.bind({}) as Story<IExportProps>;
export const SingleMode = Template.bind({}) as Story<IExportProps>;
export const SelectionBased = Template.bind({}) as Story<IExportProps>;

Default.args = {};
SingleMode.args = {
  singleMode: true,
  initialBibcodes: [fixtures.bibcodes[0]],
};
SelectionBased.args = {
  initialBibcodes: fixtures.bibcodes,
};
