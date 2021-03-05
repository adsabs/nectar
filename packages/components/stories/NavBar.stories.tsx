import { Meta, Story } from '@storybook/react';
import React from 'react';
import { INavBarProps, NavBar } from '../src/NavBar';

const meta: Meta = {
  title: 'NavBar',
  component: NavBar,
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

const Template: Story<INavBarProps> = (args) => <NavBar {...args} />;

export const Default = Template.bind({});

Default.args = {};
