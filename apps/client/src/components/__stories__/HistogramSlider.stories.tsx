import { HistogramSlider } from '@/components/HistogramSlider';
import { yearPaperCountData } from '@/components/__mocks__/yearPaperCountData';
import { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Histogram Slider',
  component: HistogramSlider,
};

type Story = StoryObj<typeof HistogramSlider>;

export default meta;

export const Default: Story = {
  args: {
    data: yearPaperCountData,
    selectedRange: [yearPaperCountData[0].x, yearPaperCountData[yearPaperCountData.length - 1].x],
    width: 200,
    height: 125,
  },
};
