import React from 'react';
import { Meta, Story } from '@storybook/react';
import { Footer, IFooterProps } from '../src/Footer';

const meta: Meta = {
  title: 'Component Footer',
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

const Template: Story<IFooterProps> = args => <Footer {...args} />;

export const Default = Template.bind({});

Default.args = {};
