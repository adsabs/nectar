import { BubblePlot } from '@/components/Visualizations';
import { graph } from '@/components/__mocks__/bubblePlotData';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/Graphs/BubblePlot',
  component: BubblePlot,
};

type Story = StoryObj<typeof BubblePlot>;

export default meta;

export const Default: Story = {
  args: {
    graph,
    xKey: 'date',
    yKey: 'read_count',
    rKey: 'citation_count',
    xScaleTypes: ['linear'],
    yScaleTypes: ['log', 'linear'],
  },
};

export const Time_Citation: Story = {
  args: {
    graph,
    xKey: 'date',
    yKey: 'citation_count',
    rKey: 'read_count',
    xScaleTypes: ['linear'],
    yScaleTypes: ['log', 'linear'],
  },
};

export const Read_Citation: Story = {
  args: {
    graph,
    xKey: 'citation_count',
    yKey: 'read_count',
    rKey: 'year',
    xScaleTypes: ['log', 'linear'],
    yScaleTypes: ['log', 'linear'],
  },
};
