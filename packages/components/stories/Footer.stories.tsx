import { Meta, Story } from '@storybook/react';
import React from 'react';
import { Footer } from '../src/Footer';

const meta: Meta = {
  title: 'Footer',
  component: Footer,
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

const Template: Story = (args) => <Footer {...args} />;

export const Default = Template.bind({});

export const DefaultArgs = Default.args = {};
