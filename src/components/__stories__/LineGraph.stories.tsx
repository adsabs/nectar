import { ILineGraphProps, LineGraph } from '@components';
import { linedatum } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/graphs/LineGraph',
  component: LineGraph,
};

export default meta;

const Template: Story<ILineGraphProps> = (args) => <LineGraph {...args} />;

export const Default = Template.bind({});

Default.args = { data: linedatum };
