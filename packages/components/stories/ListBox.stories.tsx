import React from 'react';
import { Meta, Story } from '@storybook/react';
import { ListBox, IListBoxProps } from '../src/ListBox';

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

Default.args = {};
