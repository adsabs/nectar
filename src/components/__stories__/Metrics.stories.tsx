import { Meta, Story } from '@storybook/react';
import { Metrics, IMetricsProps } from '@components';
import { metrics } from './Data';

const meta: Meta = {
  title: 'Metrics/Metrics',
  component: Metrics,
};

export default meta;

const Template: Story<IMetricsProps> = (args) => <Metrics {...args} />;

export const Default = Template.bind({}) as Story<IMetricsProps>;

Default.args = { metrics, isAbstract: false };

export const Abstract = Template.bind({}) as Story<IMetricsProps>;

Abstract.args = { metrics, isAbstract: true };
