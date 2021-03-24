import { Meta, Story } from '@storybook/react';
import React from 'react';
import { IListBoxProps, ListBox } from '../src/ListBox';

const meta: Meta = {
  title: 'ListBox',
  component: ListBox,
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

const Template: Story<IListBoxProps> = args => <ListBox {...args} />;

export const Default = Template.bind({});

export const DefaultArgs = Default.args = {
  label: 'ListBox Demo'
};
