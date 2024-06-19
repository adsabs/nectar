import { PaperNetworkGraphPane } from '@/components';
import { Meta, StoryObj } from '@storybook/react';
import { response } from '@/components/__mocks__/paperNetworkResponseData';
import { noop } from '@/utils';
import { IView } from '@/components/Visualizations/GraphPanes/types';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/PaperNetworkGraphPane',
  component: PaperNetworkGraphPane,
};

type Story = StoryObj<typeof PaperNetworkGraphPane>;

export default meta;

const views: IView[] = [
  { id: 'number_papers', label: 'Number of Papers', valueToUse: 'paper_count' },
  {
    id: 'paper_citations',
    label: 'Paper Citations',
    valueToUse: 'total_citations',
  },
  {
    id: 'paper_downloads',
    label: 'Paper Downloads',
    valueToUse: 'total_reads',
  },
];

export const Default: Story = {
  args: {
    nodesData: response.data.summaryGraph.nodes,
    linksData: response.data.summaryGraph.links,
    views,
    onChangePaperLimit: noop,
    maxPaperLimit: 200,
    paperLimit: 200,
  },
};
