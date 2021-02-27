import React from 'react';
import { Meta, Story } from '@storybook/react';
import { Layout, ILayoutProps } from '../src/Layout';

const meta: Meta = {
  title: 'Component Layout',
  component: Layout,
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

const Template: Story<ILayoutProps> = args => <Layout {...args} />;

export const Default = Template.bind({});

Default.args = {};
