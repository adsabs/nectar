import { graph } from '@/components/__mocks__/bubblePlotData';
import { Meta, StoryObj } from '@storybook/react';
import { BubblePlotPane } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/BubblePlotPane',
  component: BubblePlotPane,
};

type Story = StoryObj<typeof BubblePlotPane>;

export default meta;

export const Default: Story = {
  args: { graph },
};
