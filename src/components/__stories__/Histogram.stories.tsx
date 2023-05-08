import { Histogram, IHistogramProps } from '@components';
import { yearPaperCountData } from '@components/__mocks__/yearPaperCountData';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/graphs/Histogram',
  component: Histogram,
};

export default meta;

const Template: Story<IHistogramProps> = (args) => <Histogram {...args} />;

export const Default = Template.bind({});

Default.args = { data: yearPaperCountData, highlightDomain: [1978, 2015], w: 500, h: 500 };
