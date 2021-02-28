import React from 'react';
import { Meta, Story } from '@storybook/react';
import { SearchBar, ISearchBarProps } from '../src/SearchBar';

const meta: Meta = {
  title: 'Component SearchBar',
  component: SearchBar,
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

const Template: Story<ISearchBarProps> = args => <SearchBar {...args} />;

export const Default = Template.bind({});

Default.args = {};
