import { IADSApiPaperNetworkSummaryGraphNode } from '@api';
import { IPaperNetworkGraphProps, PaperNetworkGraph } from '@components';
import { response } from '@components/__mocks__/paperNetworkResponseData';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/Graph/PaperNetworkGraph',
  component: PaperNetworkGraph,
};

export default meta;

const Template: Story<IPaperNetworkGraphProps> = (args) => <PaperNetworkGraph {...args} />;

export const Default = Template.bind({});

Default.args = {
  nodes_data: response.data.summaryGraph.nodes,
  links_data: response.data.summaryGraph.links,
  onClickNode: (node: IADSApiPaperNetworkSummaryGraphNode) => {
    console.log(`clicked: ${node.node_name}`);
  },
  keyToUseAsValue: 'paper_count',
};
