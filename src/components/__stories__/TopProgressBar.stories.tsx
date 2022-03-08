import { Meta, Story } from '@storybook/react';
import { TopProgressBar } from '@components';

const meta: Meta = {
  title: 'TopProgressBar',
  component: TopProgressBar,
};

export default meta;

const Template: Story<{}> = (args) => <TopProgressBar {...args} />;

export const Default = Template.bind({}) as Story<{}>;

Default.args = {};
