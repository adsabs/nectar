import { BubblePlotPane } from '@/components';
import { graph } from '@/components/__mocks__/bubblePlotData';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/GraphPanes/BubblePlotPane',
  component: BubblePlotPane,
};

type Story = StoryObj<typeof BubblePlotPane>;

export default meta;

export const Default: Story = {
  args: { graph },
};
