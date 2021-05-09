import { Meta, Story } from '@storybook/react';
import React from 'react';
import { BibstemPicker, IBibstemPickerProps } from '../BibstemPicker';

const meta: Meta = {
  title: 'BibstemPicker',
  component: BibstemPicker,
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

const Template: Story<IBibstemPickerProps> = (args) => (
  <BibstemPicker {...args} />
);

export const Default = Template.bind({}) as Story<IBibstemPickerProps>;

Default.args = {};
