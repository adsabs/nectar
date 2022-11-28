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
};
