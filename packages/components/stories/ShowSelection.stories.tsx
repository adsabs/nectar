import React from 'react';
import { Meta, Story } from '@storybook/react';
import { ShowSelection, IShowSelectionProps } from '../src/ShowSelection';

const meta: Meta = {
  title: 'ShowSelection',
  component: ShowSelection,
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

const Template: Story<IShowSelectionProps> = args => <ShowSelection {...args} />;

export const Default = Template.bind({});

Default.args = {};
