import { HIndexGraphPane } from '@/components';
import { buckets, sum } from '@/components/__mocks__/hIndexGraphData';
import { Meta, StoryObj } from '@storybook/react';

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
