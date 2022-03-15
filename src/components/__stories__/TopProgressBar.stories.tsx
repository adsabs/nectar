import { TopProgressBar } from '@components';
import { Meta, Story } from '@storybook/react';

const meta: Meta = {
  title: 'TopProgressBar',
  component: TopProgressBar,
};

export default meta;

const Template: Story<Record<string, never>> = (args) => <TopProgressBar {...args} />;

export const Default = Template.bind({});

Default.args = {};
