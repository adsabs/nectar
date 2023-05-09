import { Meta, Story } from '@storybook/react';
import { SimpleCopyButton, ICopyButtonProps } from '@components';

const meta: Meta = {
  title: 'SimpleCopyButton',
  component: SimpleCopyButton,
};

export default meta;

const Template: Story<ICopyButtonProps> = (args) => <SimpleCopyButton {...args} />;

export const Default = Template.bind({});

Default.args = {
  text: 'copy text',
};
