import { Meta, Story } from '@storybook/react';
import React from 'react';
import { Dropdown, IDropdownProps } from '../src/Dropdown';

const meta: Meta = {
  title: 'Dropdown',
  component: Dropdown,
  argTypes: {
    items: {
      defaultValue: [
        { label: 'First' },
        { label: 'Second' },
        { label: 'Third' },
      ],
    },
  },
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<IDropdownProps> = (args) => <Dropdown {...args} />;

export const Default = Template.bind({});

Default.args = {};
