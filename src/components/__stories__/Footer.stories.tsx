import { Footer } from '@components/Footer';
import { Meta, Story } from '@storybook/react';
import React from 'react';

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

Default.args = {};
