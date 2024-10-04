import { buckets, sum } from '@/components/__mocks__/hIndexGraphData';
import { Meta, StoryObj } from '@storybook/react';
import { HIndexGraphPane } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/HIndexGraphPane',
  component: HIndexGraphPane,
};

type Story = StoryObj<typeof HIndexGraphPane>;

export default meta;

export const Default: Story = {
  args: {
    buckets: buckets,
    sum: sum,
    type: 'citations',
  },
};
