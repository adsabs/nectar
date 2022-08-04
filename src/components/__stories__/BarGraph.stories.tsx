import { IBarGraphProps, BarGraph } from '@components';
import { bardatum } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/graphs/BarGraph',
  component: BarGraph,
};

export default meta;

const Template: Story<IBarGraphProps> = (args) => <BarGraph {...args} />;

export const Default = Template.bind({});

Default.args = { data: bardatum, indexBy: 'year', keys: ['a1', 'a2', 'a3'] };
