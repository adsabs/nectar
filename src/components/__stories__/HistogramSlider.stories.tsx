import { HistogramSlider, IHistogramSliderProps } from '@components/HistogramSlider';
import { yearPaperCountData } from '@components/__mocks__/yearPaperCountData';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Histogram Slider',
  component: HistogramSlider,
};

export default meta;

const Template: Story<IHistogramSliderProps> = (args) => <HistogramSlider {...args} />;

export const Default = Template.bind({});

Default.args = {
  data: yearPaperCountData,
  selectedRange: [yearPaperCountData[0].x, yearPaperCountData[yearPaperCountData.length - 1].x],
  width: 200,
  height: 125,
};
