import { IndicesGraph, IIndicesGraphProps } from '@components';
import { linedatum } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Metrics/IndicesGraph',
  component: IndicesGraph,
};

export default meta;

const Template: Story<IIndicesGraphProps> = (args) => <IndicesGraph {...args} />;

export const Default = Template.bind({});

Default.args = { data: linedatum };
