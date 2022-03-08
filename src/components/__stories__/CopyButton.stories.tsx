import { Meta, Story } from '@storybook/react';
import { CopyButton, ICopyButtonProps } from '@components';

const meta: Meta = {
  title: 'CopyButton',
  component: CopyButton,
};

export default meta;

const Template: Story<ICopyButtonProps> = (args) => <CopyButton {...args} />;

export const Default = Template.bind({}) as Story<ICopyButtonProps>;

Default.args = {
  text: 'copy text',
};
