import { SunburstGraph, ISunburstGraphProps } from '@components';
import { sunburstDatum } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/graphs/SunburstGraph',
  component: SunburstGraph,
};

export default meta;

const Template: Story<ISunburstGraphProps> = (args) => <SunburstGraph {...args} />;

export const Default = Template.bind({});

Default.args = { graph: { data: sunburstDatum } };
