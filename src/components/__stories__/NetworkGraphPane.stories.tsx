import { INetworkGraphPaneProps, IView, NetworkGraphPane } from '@components';
import { response } from '@components/__mocks__/networkResponseData';
import { Meta, Story } from '@storybook/react';
import { noop } from '@utils';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/NetworkGraphPane',
  component: NetworkGraphPane,
};

export default meta;

const Template: Story<INetworkGraphPaneProps> = (args) => <NetworkGraphPane {...args} />;

export const Default = Template.bind({});

const views: IView[] = [
  { id: 'author_occurrences', label: 'Author Occurrences', valueToUse: 'size' },
  { id: 'paper_citations', label: 'Paper Citations', valueToUse: 'citation_count' },
  { id: 'paper_downloads', label: 'Paper Downloads', valueToUse: 'read_count' },
];

Default.args = {
  root: response.data.root,
  link_data: response.data.link_data,
  views,
  onChangePaperLimit: noop,
  maxPaperLimit: 200,
  paperLimit: 200,
};
