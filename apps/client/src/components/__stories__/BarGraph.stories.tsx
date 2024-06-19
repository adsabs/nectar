import { BarGraph } from '@/components';
import { bardatum } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/graphs/BarGraph',
  component: BarGraph,
};

type Story = StoryObj<typeof BarGraph>;

export default meta;

export const Default: Story = {
  args: { data: bardatum, indexBy: 'year', keys: ['a1', 'a2', 'a3'] },
};
