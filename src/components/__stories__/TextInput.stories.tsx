import { Meta, Story } from '@storybook/react';
import React from 'react';
import { ITextInputProps, TextInput } from '../TextInput';

const meta: Meta = {
  title: 'TextInput',
  component: TextInput,
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

const Template: Story<ITextInputProps> = (args) => <TextInput {...args} />;

export const Default = Template.bind({}) as Story<ITextInputProps>;

Default.args = {};
