import { IPaperNetworkGraphProps, PaperNetworkGraph } from '@components';
import { response } from '@components/__mocks__/paperNetworkResponseData';
import { Meta, Story } from '@storybook/react';
import { noop } from '@utils';

const meta: Meta = {
  title: 'Visualizations/Graphs/PaperNetworkGraph',
  component: PaperNetworkGraph,
};

export default meta;

const Template: Story<IPaperNetworkGraphProps> = (args) => <PaperNetworkGraph {...args} />;

export const Default = Template.bind({});

Default.args = {
  nodesData: response.data.summaryGraph.nodes,
  linksData: response.data.summaryGraph.links,
  onClickNode: noop,
  keyToUseAsValue: 'paper_count',
};
