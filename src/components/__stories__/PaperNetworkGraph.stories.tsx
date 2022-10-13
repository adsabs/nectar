import { IADSApiPaperNetworkSummaryGraphNode } from '@api';
import { IPaperNetworkGraphProps, PaperNetworkGraph } from '@components';
import { response } from '@components/__mocks__/paperNetworkResponseData';
import { Meta, Story } from '@storybook/react';

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
  onClickNode: (node: IADSApiPaperNetworkSummaryGraphNode) => {
    console.log(`clicked: ${node.node_name}`);
  },
  keyToUseAsValue: 'paper_count',
};
