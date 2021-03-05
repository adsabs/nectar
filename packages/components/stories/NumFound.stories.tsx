import { Meta, Story } from '@storybook/react';
import React from 'react';
import { INumFoundProps, NumFound } from '../src/NumFound';

const meta: Meta = {
  title: 'NumFound',
  component: NumFound,
  argTypes: {},
  parameters: {
    controls: { expanded: true },
  },
};

export default meta;

const Template: Story<INumFoundProps> = (args) => <NumFound {...args} />;

export const Default = Template.bind({});

Default.args = {};
