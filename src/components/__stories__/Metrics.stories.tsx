import { IMetricsProps, Metrics } from '@components';
import { metrics } from '@components/__mocks__/data';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/Metrics',
  component: Metrics,
};

export default meta;

const Template: Story<IMetricsProps> = (args) => <Metrics {...args} />;

export const Default = Template.bind({});

Default.args = { metrics, isAbstract: false };

export const Abstract = Template.bind({});

Abstract.args = { metrics, isAbstract: true };
