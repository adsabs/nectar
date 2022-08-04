import { INetworkGraphPaneProps, NetworkGraphPane } from '@components';
import { sunburstNode } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';
import { noop } from '@utils';

const views = [
  {
    id: 'view1',
    label: 'View 1',
  },
  {
    id: 'view2',
    label: 'View 2',
  },
  {
    id: 'view3',
    label: 'View 3',
  },
];

const meta: Meta = {
  title: 'Visualizations/GraphPanes/NetworkGraphPane',
  component: NetworkGraphPane,
};

export default meta;

const Template: Story<INetworkGraphPaneProps> = (args) => <NetworkGraphPane {...args} />;

export const Default = Template.bind({});

Default.args = {
  graph: { data: sunburstNode, idKey: 'name', valueKey: 'value' },
  views,
  onChangeView: noop,
  defaultView: 'view1',
};
