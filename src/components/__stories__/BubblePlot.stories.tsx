import { BubblePlot, BubblePlotProps } from '@components/Visualizations';
import { graph } from '@components/__mocks__/bubblePlotData';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/Graphs/BubblePlot',
  component: BubblePlot,
};

export default meta;

const Template: Story<BubblePlotProps> = (args) => <BubblePlot {...args} />;

export const Default = Template.bind({});
export const Time_Citation = Template.bind({});
export const Read_Citation = Template.bind({});

Default.args = {
  graph,
  xKey: 'date',
  yKey: 'read_count',
  rKey: 'citation_count',
  xScaleTypes: ['linear'],
  yScaleTypes: ['log', 'linear'],
};

Time_Citation.args = {
  graph,
  xKey: 'date',
  yKey: 'citation_count',
  rKey: 'read_count',
  xScaleTypes: ['linear'],
  yScaleTypes: ['log', 'linear'],
};

Read_Citation.args = {
  graph,
  xKey: 'citation_count',
  yKey: 'read_count',
  rKey: 'year',
  xScaleTypes: ['log', 'linear'],
  yScaleTypes: ['log', 'linear'],
};
