import { MetricsGraph, IMetricsGraphProps } from '@components';
import { bardatum } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Metrics/MetricsGraph',
  component: MetricsGraph,
};

export default meta;

const Template: Story<IMetricsGraphProps> = (args) => <MetricsGraph {...args} />;

export const Default = Template.bind({});

Default.args = { data: bardatum, indexBy: 'year', keys: ['a1', 'a2', 'a3'] };
