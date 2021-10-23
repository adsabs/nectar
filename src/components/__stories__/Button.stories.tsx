import { Meta, Story } from '@storybook/react';
import { Button, IButtonProps } from '../Button';

const meta: Meta = {
  title: 'Button',
  component: Button,
  argTypes: {
    children: {
      control: {
        type: 'text',
      },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<IButtonProps> = (args) => <Button {...args} />;

export const Default = Template.bind({}) as Story<IButtonProps>;

Default.args = {};
