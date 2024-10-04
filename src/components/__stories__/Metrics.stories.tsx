import { metrics } from '@/components/__mocks__/data';
import { Meta, StoryObj } from '@storybook/react';
import { MetricsPane } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/Metrics',
  component: MetricsPane,
};

type Story = StoryObj<typeof MetricsPane>;

export default meta;

export const Default: Story = {
  args: { metrics, isAbstract: false },
};

export const Abstract: Story = {
  args: { metrics, isAbstract: true },
};
