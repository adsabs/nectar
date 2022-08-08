import { IYearsGraphPaneProps, YearsGraphPane } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'Visualizations/YearsGraphPane',
  component: YearsGraphPane,
};

export default meta;

const Template: Story<IYearsGraphPaneProps> = (args) => <YearsGraphPane {...args} />;

export const Default = Template.bind({});

Default.args = {};
