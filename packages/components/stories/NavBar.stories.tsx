import React from 'react';
import { Meta, Story } from '@storybook/react';
import { NavBar, INavBarProps } from '../src/NavBar';

const meta: Meta = {
  title: 'Component NavBar',
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

const Template: Story<INavBarProps> = args => <NavBar {...args} />;

export const Default = Template.bind({});

Default.args = {};
