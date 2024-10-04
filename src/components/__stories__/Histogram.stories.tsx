import { yearPaperCountData } from '@/components/__mocks__/yearPaperCountData';
import { Meta, StoryObj } from '@storybook/react';
import { Histogram } from '@/components/Visualizations';

const meta: Meta = {
  title: 'Visualizations/graphs/Histogram',
  component: Histogram,
};

type Story = StoryObj<typeof Histogram>;
export default meta;

export const Default: Story = {
  args: {
    data: yearPaperCountData,
    highlightDomain: [1978, 2015],
    w: 500,
    h: 500,
  },
};
