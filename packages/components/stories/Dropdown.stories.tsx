import { Meta, Story } from '@storybook/react';
import React from 'react';
import { DropdownList, IDropdownListProps } from '../src/Dropdown';

const meta: Meta = {
  title: 'Dropdown',
  component: DropdownList,
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

const Template: Story<IDropdownListProps> = (args) => (
  <DropdownList {...args} />
);

export const Default = Template.bind({});

Default.args = {};
