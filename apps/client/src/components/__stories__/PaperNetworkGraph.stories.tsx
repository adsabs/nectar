import { PaperNetworkGraph } from '@/components';
import { response } from '@/components/__mocks__/paperNetworkResponseData';
import { Meta, StoryObj } from '@storybook/react';
import { noop } from '@/utils';

const meta: Meta = {
  title: 'Visualizations/Graphs/PaperNetworkGraph',
  component: PaperNetworkGraph,
};

type Story = StoryObj<typeof PaperNetworkGraph>;

export default meta;

export const Default: Story = {
  args: {
    nodesData: response.data.summaryGraph.nodes,
    linksData: response.data.summaryGraph.links,
    onClickNode: noop,
    keyToUseAsValue: 'paper_count',
  },
};
